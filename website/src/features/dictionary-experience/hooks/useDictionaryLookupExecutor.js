/**
 * 背景：查询执行需同时处理流式渲染、缓存回填与语言解析，若留在主 Hook 会导致职责臃肿。
 * 目的：抽离独立执行器，隔离副作用并以策略模式支持不同查询场景。
 * 关键取舍：保持外部纯数据契约并复用 streaming buffer，避免重复实现。
 * 影响范围：DictionaryExperience 的主动查询、历史回放与版本切换。
 * 演进与TODO：后续可扩展查询埋点或多模型能力。
 */
import { useCallback } from "react";
import {
  resolveDictionaryConfig,
  WORD_LANGUAGE_AUTO,
} from "@shared/utils";
import { wordCacheKey } from "@shared/api/words.js";
import { DEFAULT_MODEL } from "@core/config";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../dictionaryExperienceViews.js";
import { createDictionaryStreamingMarkdownBuffer } from "../streaming/dictionaryStreamingMarkdownBuffer.js";
import { createDictionaryStreamChunkInterpreter } from "../streaming/dictionaryStreamChunkInterpreter.js";
import { coerceResolvedTerm } from "./coerceResolvedTerm.js";

/**
 * 意图：输出执行查询的回调函数，统一处理缓存命中、流式结果与状态同步。
 * 输入：查询依赖（streamWord、user 等）与状态 setter；
 * 输出：executeLookup(term, options)。
 */
export function useDictionaryLookupExecutor({
  streamWord,
  user,
  beginLookup,
  clearActiveLookup,
  isMounted,
  setActiveView,
  setLoading,
  setEntry,
  setStreamText,
  setFinalText,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  currentTermKey,
  setCurrentTermKey,
  setCurrentTerm,
  wordStoreApi,
  applyRecord,
  setVersions,
  setActiveVersionId,
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
      const cacheKey = wordCacheKey({
        term: normalized,
        language: resolvedLanguage,
        flavor: targetFlavor,
        model: DEFAULT_MODEL,
      });
      const isNewTerm = currentTermKey !== cacheKey;
      const shouldResetView = isNewTerm || forceNew;
      setCurrentTermKey(cacheKey);
      setCurrentTerm(normalized);
      setStreamText("");
      if (shouldResetView) {
        setEntry(null);
        setFinalText("");
        setVersions([]);
        setActiveVersionId(null);
      }

      let resolvedTerm = normalized;

      if (!forceNew && versionId) {
        const cachedRecord = wordStoreApi.getState().getRecord?.(cacheKey);
        if (cachedRecord) {
          const hydrated = applyRecord(cacheKey, cachedRecord, versionId);
          if (hydrated) {
            resolvedTerm = coerceResolvedTerm(hydrated.term, normalized);
            setLoading(false);
            clearActiveLookup();
            return {
              status: "success",
              term: resolvedTerm,
              queriedTerm: normalized,
              detectedLanguage: resolvedLanguage,
              flavor: targetFlavor,
            };
          }
        }
      }

      let detected = resolvedLanguage;
      try {
        const buffer = createDictionaryStreamingMarkdownBuffer();
        const chunkInterpreter = createDictionaryStreamChunkInterpreter();
        let latestResolvedEntry = null;
        for await (const chunk of streamWord({
          term: normalized,
          language: resolvedLanguage,
          flavor: targetFlavor,
          model: DEFAULT_MODEL,
          user,
          controller,
          forceNew,
          versionId,
        })) {
          if (chunk.language) {
            detected = chunk.language;
          }

          const {
            text: chunkText,
            entry: interpretedEntry,
            operation: chunkOperation,
          } =
            chunkInterpreter.interpret(chunk.chunk);

          if (interpretedEntry) {
            latestResolvedEntry = interpretedEntry;
            resolvedTerm = coerceResolvedTerm(
              interpretedEntry.term,
              resolvedTerm,
            );
            setEntry(interpretedEntry);
          }

          const normalizedChunkText = chunkText ?? "";
          const shouldProcessBuffer =
            (normalizedChunkText.length > 0 || chunkOperation === "replace");

          if (shouldProcessBuffer) {
            const { preview, entry } =
              chunkOperation === "replace"
                ? buffer.replace(normalizedChunkText)
                : buffer.append(normalizedChunkText);
            if (entry) {
              latestResolvedEntry = entry;
              resolvedTerm = coerceResolvedTerm(entry.term, resolvedTerm);
              setEntry(entry);
            }
            if (preview !== null) {
              setStreamText(preview);
            }
          }
        }

        const { markdown: finalMarkdown, entry: finalEntry } = buffer.finalize();
        const resolvedEntry = finalEntry ?? latestResolvedEntry;
        if (resolvedEntry) {
          resolvedTerm = coerceResolvedTerm(resolvedEntry.term, resolvedTerm);
          setEntry(resolvedEntry);
        }
        // buffer.finalize() 已返回归一化后的 Markdown，直接透传即可避免重复清洗。
        if (finalMarkdown) {
          setFinalText(finalMarkdown);
        }

        const detectedLanguage = detected ?? resolvedLanguage;
        setCurrentTerm(resolvedTerm);
        return {
          status: "success",
          term: resolvedTerm,
          queriedTerm: normalized,
          detectedLanguage,
          flavor: targetFlavor,
        };
      } catch (error) {
        if (error.name === "AbortError") {
          return { status: "cancelled", term: normalized };
        }

        showPopup(error.message);
        return { status: "error", term: normalized, error };
      } finally {
        if (!controller.signal.aborted && isMounted()) {
          setLoading(false);
        }
        clearActiveLookup();
      }
    },
    [
      streamWord,
      user,
      beginLookup,
      clearActiveLookup,
      isMounted,
      setActiveView,
      setLoading,
      setEntry,
      setStreamText,
      setFinalText,
      dictionarySourceLanguage,
      dictionaryTargetLanguage,
      currentTermKey,
      setCurrentTermKey,
      setCurrentTerm,
      wordStoreApi,
      applyRecord,
      setVersions,
      setActiveVersionId,
      resetCopyFeedback,
      showPopup,
    ],
  );

  return { executeLookup };
}
