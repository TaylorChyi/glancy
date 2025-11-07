import { useCallback } from "react";
import { resolveDictionaryConfig, WORD_LANGUAGE_AUTO } from "@shared/utils";
import { wordCacheKey } from "@shared/api/words.js";
import { DEFAULT_MODEL } from "@core/config";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../dictionaryExperienceViews.js";
import { normalizeDictionaryMarkdown } from "../markdown/dictionaryMarkdownNormalizer.js";
import { coerceResolvedTerm } from "./coerceResolvedTerm.js";

/**
 * 意图：输出执行查询的回调函数，统一处理缓存命中、非流式结果与状态同步。
 * 输入：查询依赖（fetchWord、用户上下文等）与状态 setter；
 * 输出：executeLookup(term, options)。
 */
export function useDictionaryLookupExecutor({
  fetchWord,
  user,
  beginLookup,
  clearActiveLookup,
  isMounted,
  setActiveView,
  setLoading,
  setEntry,
  setFinalText,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  currentTermKey,
  setCurrentTermKey,
  setCurrentTerm,
  wordStoreApi,
  applyRecord,
  resetCopyFeedback,
  showPopup,
}) {
  const executeLookup = useCallback(
    async (
      term,
      {
        forceNew = false,
        versionId,
        language: preferredLanguage,
        flavor: preferredFlavor,
      } = {},
    ) => {
      const normalized = term.trim();
      if (!normalized) {
        return { status: "idle", term: normalized };
      }

      setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
      resetCopyFeedback();
      const controller = beginLookup();

      setLoading(true);
      const { language: resolvedLanguage, flavor: defaultFlavor } =
        resolveDictionaryConfig(normalized, {
          sourceLanguage:
            preferredLanguage ?? dictionarySourceLanguage ?? WORD_LANGUAGE_AUTO,
          targetLanguage: dictionaryTargetLanguage,
        });
      const targetFlavor = preferredFlavor ?? defaultFlavor;
      const initialCacheKey = wordCacheKey({
        term: normalized,
        language: resolvedLanguage,
        flavor: targetFlavor,
        model: DEFAULT_MODEL,
      });
      const isNewTerm = currentTermKey !== initialCacheKey;
      const shouldResetView = isNewTerm || forceNew;
      setCurrentTermKey(initialCacheKey);
      setCurrentTerm(normalized);
      if (shouldResetView) {
        setEntry(null);
        setFinalText("");
      }

      let resolvedTerm = normalized;

      if (!forceNew && versionId) {
        const cachedRecord = wordStoreApi.getState().getRecord?.(initialCacheKey);
        if (cachedRecord) {
          const hydrated = applyRecord(initialCacheKey, cachedRecord, versionId);
          if (hydrated) {
            resolvedTerm = coerceResolvedTerm(hydrated.term, normalized);
            setLoading(false);
            clearActiveLookup();
            return {
              status: "success",
              term: resolvedTerm,
              queriedTerm: normalized,
              detectedLanguage: hydrated.language ?? resolvedLanguage,
              flavor: targetFlavor,
            };
          }
        }
      }

      try {
        const response = await fetchWord({
          user,
          term: normalized,
          language: resolvedLanguage,
          flavor: targetFlavor,
          model: DEFAULT_MODEL,
          forceNew,
          versionId,
        });

        if (controller.signal.aborted) {
          return { status: "cancelled", term: normalized };
        }

        const { data, error, language: upstreamLanguage, flavor: upstreamFlavor } =
          response ?? {};

        if (error) {
          showPopup(error.message ?? String(error));
          return { status: "error", term: normalized, error };
        }

        const detectedLanguage =
          data?.language ?? upstreamLanguage ?? resolvedLanguage;
        const resolvedFlavor = upstreamFlavor ?? targetFlavor;
        const cacheKey = wordCacheKey({
          term: normalized,
          language: detectedLanguage,
          flavor: resolvedFlavor,
          model: DEFAULT_MODEL,
        });
        if (cacheKey !== initialCacheKey) {
          setCurrentTermKey(cacheKey);
        }

        const storeState = wordStoreApi.getState();
        const record = storeState.getRecord?.(cacheKey);
        const preferredVersionId =
          versionId ??
          record?.activeVersionId ??
          data?.id ??
          data?.versionId ??
          null;
        const hydrated = applyRecord(cacheKey, record, preferredVersionId);

        if (hydrated) {
          resolvedTerm = coerceResolvedTerm(hydrated.term, normalized);
        } else if (data) {
          const normalizedMarkdown = normalizeDictionaryMarkdown(
            data.markdown ?? "",
          );
          const fallbackEntry = {
            ...data,
            markdown: normalizedMarkdown,
          };
          setEntry(fallbackEntry);
          setFinalText(normalizedMarkdown);
          if (fallbackEntry.term) {
            resolvedTerm = coerceResolvedTerm(fallbackEntry.term, normalized);
          }
          setCurrentTerm(fallbackEntry.term ?? normalized);
        } else {
          setEntry(null);
          setFinalText("");
        }

        return {
          status: "success",
          term: resolvedTerm,
          queriedTerm: normalized,
          detectedLanguage,
          flavor: resolvedFlavor,
        };
      } catch (error) {
        if (controller.signal.aborted) {
          return { status: "cancelled", term: normalized };
        }
        showPopup(error.message ?? String(error));
        return { status: "error", term: normalized, error };
      } finally {
        if (!controller.signal.aborted && isMounted()) {
          setLoading(false);
        }
        clearActiveLookup();
      }
    },
    [
      fetchWord,
      user,
      beginLookup,
      clearActiveLookup,
      isMounted,
      setActiveView,
      setLoading,
      setEntry,
      setFinalText,
      dictionarySourceLanguage,
      dictionaryTargetLanguage,
      currentTermKey,
      setCurrentTermKey,
      setCurrentTerm,
      wordStoreApi,
      applyRecord,
      resetCopyFeedback,
      showPopup,
    ],
  );

  return { executeLookup };
}
