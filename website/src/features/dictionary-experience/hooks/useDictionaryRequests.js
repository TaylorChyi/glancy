import { useCallback, useMemo } from "react";
import { wordCacheKey } from "@shared/api/words.js";
import {
  resolveDictionaryConfig,
  resolveDictionaryFlavor,
  WORD_LANGUAGE_AUTO,
} from "@shared/utils";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../dictionaryExperienceViews.js";
import { normalizeDictionaryMarkdown } from "../markdown/dictionaryMarkdownNormalizer.js";
import { coerceResolvedTerm } from "./coerceResolvedTerm.js";
import { useDictionaryRecordHydrator } from "./useDictionaryRecordHydrator.js";
import { createHistoryStrategy } from "../history/historyStrategy.js";
import { useDictionaryClient } from "@shared/services/dictionary/dictionaryClient.ts";

const sanitizeTerm = (value = "") => value.trim();

const buildCacheKey = ({ term, language, flavor }) =>
  wordCacheKey({ term, language, flavor });

const createLookupConfig = ({ term, sourceLanguage, targetLanguage, flavor }) =>
  resolveDictionaryConfig(term, {
    sourceLanguage: sourceLanguage ?? WORD_LANGUAGE_AUTO,
    targetLanguage,
    flavor,
  });

const buildFallbackEntry = (data) => {
  if (!data || typeof data !== "object") return null;
  return {
    ...data,
    markdown: normalizeDictionaryMarkdown(data.markdown ?? ""),
  };
};

const tryHydrateCachedVersion = ({
  cacheKey,
  versionId,
  applyRecord,
  wordStoreApi,
}) => {
  if (!cacheKey) return null;
  const cached = wordStoreApi.getState().getRecord?.(cacheKey);
  if (!cached) return null;
  return applyRecord(
    cacheKey,
    cached,
    versionId ?? cached.activeVersionId,
  );
};

const resolveHistorySelection = ({
  strategy,
  identifier,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryFlavor,
}) => {
  const selection = strategy.find(identifier);
  const term =
    typeof identifier === "string"
      ? identifier
      : selection?.term ?? "";
  if (!term) {
    return null;
  }
  const fallback = resolveDictionaryConfig(term, {
    sourceLanguage:
      selection?.language ?? dictionarySourceLanguage ?? WORD_LANGUAGE_AUTO,
    targetLanguage: dictionaryTargetLanguage,
  });
  const resolvedLanguage = selection?.language ?? fallback.language;
  const resolvedFlavor =
    selection?.flavor ??
    resolveDictionaryFlavor({
      sourceLanguage: selection?.language ?? dictionarySourceLanguage,
      targetLanguage: dictionaryTargetLanguage,
      resolvedSourceLanguage: fallback.language,
    }) ??
    dictionaryFlavor;
  const versionId =
    selection?.latestVersionId ??
    selection?.versionId ??
    selection?.activeVersionId ??
    null;
  return {
    term,
    language: resolvedLanguage,
    flavor: resolvedFlavor,
    versionId,
    cacheKey: buildCacheKey({
      term,
      language: resolvedLanguage,
      flavor: resolvedFlavor,
    }),
    selection,
  };
};

const buildSuccessResult = ({
  resolvedTerm,
  normalized,
  language,
  flavor,
}) => ({
  status: "success",
  term: resolvedTerm,
  queriedTerm: normalized,
  detectedLanguage: language,
  flavor,
});

const applyFallbackResult = ({
  data,
  normalized,
  setEntry,
  setFinalText,
  setCurrentTerm,
}) => {
  const entry = buildFallbackEntry(data);
  if (!entry) {
    setEntry(null);
    setFinalText("");
    setCurrentTerm(normalized);
    return normalized;
  }
  setEntry(entry);
  setFinalText(entry.markdown ?? "");
  setCurrentTerm(entry.term ?? normalized);
  return entry.term ?? normalized;
};

const prepareLookup = ({
  term,
  options,
  state,
  languageConfig,
  copyController,
  lookupController,
}) => {
  const normalized = sanitizeTerm(term);
  if (!normalized) {
    return { ready: false, result: { status: "idle", term: "" } };
  }
  state.setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
  copyController.resetCopyFeedback();
  const controller = lookupController.beginLookup();
  state.setLoading(true);
  const preferences = {
    sourceLanguage: options.language ?? languageConfig.dictionarySourceLanguage,
    targetLanguage: languageConfig.dictionaryTargetLanguage,
    flavor: options.flavor ?? languageConfig.dictionaryFlavor,
  };
  const config = createLookupConfig({
    term: normalized,
    ...preferences,
  });
  const cacheKey = buildCacheKey({
    term: normalized,
    language: config.language,
    flavor: config.flavor,
  });
  const shouldReset =
    state.currentTermKey !== cacheKey || Boolean(options.forceNew);
  state.setCurrentTerm(normalized);
  state.setCurrentTermKey(cacheKey);
  if (shouldReset) {
    state.setEntry(null);
    state.setFinalText("");
  }
  return {
    ready: true,
    normalized,
    cacheKey,
    config,
    controller,
    preferences,
  };
};

export function useDictionaryRequests(core) {
  const dictionaryClient = useDictionaryClient();
  const { state, contexts, lookupController, wordStoreApi, historyCaptureEnabled, copyController } =
    core;
  const { user } = contexts.userContext;
  const { historyContext, popup, navigate, languageConfig } = contexts;
  const userId = user?.id ?? "";
  const userToken = user?.token ?? "";
  const historyStrategy = useMemo(
    () => createHistoryStrategy(historyContext.history ?? []),
    [historyContext.history],
  );
  const applyRecord = useDictionaryRecordHydrator({
    wordStoreApi,
    setEntry: state.setEntry,
    setFinalText: state.setFinalText,
    setCurrentTerm: state.setCurrentTerm,
  });

  const hydrateRecord = useCallback(
    (termKey, preferredVersionId) =>
      tryHydrateCachedVersion({
        cacheKey: termKey,
        versionId: preferredVersionId,
        applyRecord,
        wordStoreApi,
      }),
    [applyRecord, wordStoreApi],
  );

  const loadEntry = useCallback(
    async (term, options = {}) => {
      const normalizedInput = sanitizeTerm(term);
      if (!normalizedInput) {
        return { status: "idle", term: "" };
      }
      if (!userId) {
        popup.showPopup("请先登录");
        return { status: "error", term: normalizedInput };
      }
      const context = prepareLookup({
        term: normalizedInput,
        options,
        state,
        languageConfig,
        copyController,
        lookupController,
      });
      if (!context.ready) return context.result;
      const { normalized, cacheKey, config } = context;

      const cached = options.versionId
        ? tryHydrateCachedVersion({
            cacheKey,
            versionId: options.versionId,
            applyRecord,
            wordStoreApi,
          })
        : null;
      if (cached && !options.forceNew) {
        lookupController.clearActiveLookup();
        state.setLoading(false);
        return buildSuccessResult({
          resolvedTerm: coerceResolvedTerm(cached.term, normalized),
          normalized,
          language: cached.language ?? config.language,
          flavor: cached.flavor ?? config.flavor,
        });
      }

      try {
        const response = await dictionaryClient.loadEntry({
          term: normalized,
          userId,
          token: userToken,
          sourceLanguage: context.preferences.sourceLanguage,
          targetLanguage: context.preferences.targetLanguage,
          flavor: context.preferences.flavor,
          forceNew: options.forceNew,
          versionId: options.versionId,
          captureHistory: historyCaptureEnabled,
        });

        if (context.controller.signal.aborted) {
          return { status: "cancelled", term: normalized };
        }

        if (response.error) {
          popup.showPopup(response.error.message);
          return { status: "error", term: normalized, error: response.error };
        }

        const detectedLanguage = response.language ?? config.language;
        const resolvedFlavor = response.flavor ?? config.flavor;
        const resolvedKey = buildCacheKey({
          term: normalized,
          language: detectedLanguage,
          flavor: resolvedFlavor,
        });

        if (resolvedKey !== cacheKey) {
          state.setCurrentTermKey(resolvedKey);
        }

        const hydrated = tryHydrateCachedVersion({
          cacheKey: resolvedKey,
          versionId: options.versionId,
          applyRecord,
          wordStoreApi,
        });

        const resolvedTerm = hydrated
          ? coerceResolvedTerm(hydrated.term, normalized)
          : applyFallbackResult({
              data: response.data,
              normalized,
              setEntry: state.setEntry,
              setFinalText: state.setFinalText,
              setCurrentTerm: state.setCurrentTerm,
            });

        return buildSuccessResult({
          resolvedTerm,
          normalized,
          language: detectedLanguage,
          flavor: resolvedFlavor,
        });
      } catch (error) {
        if (context.controller.signal.aborted) {
          return { status: "cancelled", term: normalized };
        }
        popup.showPopup(error.message ?? String(error));
        return { status: "error", term: normalized, error };
      } finally {
        if (!context.controller.signal.aborted && lookupController.isMounted()) {
          state.setLoading(false);
        }
        lookupController.clearActiveLookup();
      }
    },
    [
      state,
      languageConfig,
      copyController,
      lookupController,
      dictionaryClient,
      userId,
      userToken,
      historyCaptureEnabled,
      popup,
      applyRecord,
      wordStoreApi,
    ],
  );

  const fetchExamples = useCallback(
    async (term) => {
      if (!userId) {
        return {
          examples: [],
          error: { code: "UNAUTHENTICATED", message: "请先登录" },
        };
      }
      return dictionaryClient.fetchExamples({
        term,
        userId,
        token: userToken,
        sourceLanguage: languageConfig.dictionarySourceLanguage,
        targetLanguage: languageConfig.dictionaryTargetLanguage,
        flavor: languageConfig.dictionaryFlavor,
      });
    },
    [
      dictionaryClient,
      userId,
      userToken,
      languageConfig.dictionarySourceLanguage,
      languageConfig.dictionaryTargetLanguage,
      languageConfig.dictionaryFlavor,
    ],
  );

  const handleSend = useCallback(
    async (event) => {
      event.preventDefault();
      if (!user) {
        navigate("/login");
        return;
      }
      if (!sanitizeTerm(state.text)) return;
      const inputValue = sanitizeTerm(state.text);
      state.setText("");
      const result = await loadEntry(inputValue);
      if (result.status !== "success" || !historyCaptureEnabled) {
        return;
      }
      const historyTerm = result.term ?? result.queriedTerm ?? inputValue;
      historyContext.addHistory(
        historyTerm,
        user,
        result.detectedLanguage,
        result.flavor ?? languageConfig.dictionaryFlavor,
      );
    },
    [
      user,
      navigate,
      state,
      loadEntry,
      historyCaptureEnabled,
      historyContext,
      languageConfig.dictionaryFlavor,
    ],
  );

  const handleReoutput = useCallback(() => {
    if (!state.currentTerm) return;
    loadEntry(state.currentTerm, { forceNew: true });
  }, [state.currentTerm, loadEntry]);

  const handleSelectHistory = useCallback(
    async (identifier, versionId) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const selection = resolveHistorySelection({
        strategy: historyStrategy,
        identifier,
        dictionarySourceLanguage: languageConfig.dictionarySourceLanguage,
        dictionaryTargetLanguage: languageConfig.dictionaryTargetLanguage,
        dictionaryFlavor: languageConfig.dictionaryFlavor,
      });

      if (!selection) return;

      state.setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
      state.setCurrentTermKey(selection.cacheKey);
      state.setCurrentTerm(selection.term);
      copyController.resetCopyFeedback();
      lookupController.cancelActiveLookup();

      const hydrated = hydrateRecord(
        selection.cacheKey,
        versionId ?? selection.versionId,
      );
      if (hydrated) {
        state.setLoading(false);
        return;
      }

      await loadEntry(selection.term, {
        language: selection.language,
        flavor: selection.flavor,
        versionId: versionId ?? selection.versionId,
      });
    },
    [
      user,
      navigate,
      historyStrategy,
      languageConfig,
      state,
      copyController,
      lookupController,
      hydrateRecord,
      loadEntry,
    ],
  );

  const handleDeleteHistory = useCallback(async () => {
    const activeTerm = state.entry?.term || state.currentTerm;
    if (!activeTerm) return;
    try {
      await historyContext.removeHistory(activeTerm, user);
      state.setEntry(null);
      state.setFinalText("");
      state.setCurrentTermKey(null);
      state.setCurrentTerm("");
      copyController.resetCopyFeedback();
    } catch (error) {
      console.error("[DictionaryExperience] remove history failed", error);
      popup.showPopup(error.message ?? String(error));
    }
  }, [
    state.entry,
    state.currentTerm,
    historyContext,
    user,
    state,
    copyController,
    popup,
  ]);

  return {
    loadEntry,
    fetchExamples,
    hydrateRecord,
    handleSend,
    handleReoutput,
    handleSelectHistory,
    handleDeleteHistory,
    applyRecord,
  };
}
