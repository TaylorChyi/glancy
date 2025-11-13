import { useCallback } from "react";
import { useDictionaryClient } from "@shared/services/dictionary/dictionaryClient.ts";
import { useDictionaryRecordHydrator } from "../../hooks/useDictionaryRecordHydrator.js";
import {
  hydrateCachedRecord,
  hydrateInitialCache,
  resolveCacheHit,
} from "./dictionaryRequestCache.js";
import {
  executeDictionaryFetch,
  normalizeNetworkResponse,
  isAborted,
} from "./dictionaryRequestNetwork.js";
import {
  prepareLoadEntryContext,
  validateLoadEntryInput,
} from "./dictionaryRequestValidation.js";

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
      hydrateCachedRecord({
        cacheKey: termKey,
        versionId: preferredVersionId,
        applyRecord,
        wordStoreApi,
      }),
    [applyRecord, wordStoreApi],
  );

  const loadEntry = useCallback(
    async (term, options = {}) => {
      const validation = validateLoadEntryInput({ term, userId, popup });
      if (validation.type === "result") {
        return validation.result;
      }

      const contextResolution = prepareLoadEntryContext({
        term: validation.normalized,
        options,
        state,
        languageConfig,
        copyController,
        lookupController,
      });
      if (contextResolution.type === "result") {
        return contextResolution.result;
      }

      const { context } = contextResolution;

      const cached = hydrateInitialCache({
        context,
        options,
        applyRecord,
        wordStoreApi,
      });

      const cacheResult = resolveCacheHit({
        cached,
        options,
        context,
        lookupController,
        state,
      });
      if (cacheResult) {
        return cacheResult;
      }

      try {
        const response = await executeDictionaryFetch({
          dictionaryClient,
          context,
          userId,
          userToken,
          historyCaptureEnabled,
          options,
        });

        if (isAborted(context.controller)) {
          return { status: "cancelled", term: context.normalized };
        }

        const normalizedResponse = normalizeNetworkResponse({
          response,
          context,
          options,
          applyRecord,
          wordStoreApi,
          state,
        });

        if (normalizedResponse.type === "error") {
          popup.showPopup(normalizedResponse.message);
          return normalizedResponse.result;
        }

        return normalizedResponse.result;
      } catch (error) {
        if (isAborted(context.controller)) {
          return { status: "cancelled", term: context.normalized };
        }
        popup.showPopup(error.message ?? String(error));
        return { status: "error", term: context.normalized, error };
      } finally {
        if (!isAborted(context.controller) && lookupController.isMounted()) {
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

export default useDictionaryRequestLoaders;
