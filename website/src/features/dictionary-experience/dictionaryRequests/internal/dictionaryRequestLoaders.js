import { useCallback } from "react";
import { useDictionaryClient } from "@shared/services/dictionary/dictionaryClient.ts";
import { useDictionaryRecordHydrator } from "../../hooks/useDictionaryRecordHydrator.js";
import {
  sanitizeTerm,
  tryHydrateCachedVersion,
  prepareLookup,
  buildSuccessResult,
  applyFallbackResult,
  resolveResolvedTerm,
  buildCacheKey,
} from "./dictionaryRequestHelpers.js";

export const useDictionaryRequestLoaders = (core) => {
  const dictionaryClient = useDictionaryClient();
  const {
    state,
    contexts,
    lookupController,
    wordStoreApi,
    historyCaptureEnabled,
    copyController,
  } = core;
  const { user } = contexts.userContext;
  const { popup, languageConfig } = contexts;
  const userId = user?.id ?? "";
  const userToken = user?.token ?? "";

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
          resolvedTerm: resolveResolvedTerm(cached, normalized),
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
          ? resolveResolvedTerm(hydrated, normalized)
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

  return {
    loadEntry,
    fetchExamples,
    hydrateRecord,
    applyRecord,
  };
};
