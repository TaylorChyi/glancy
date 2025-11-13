import { useCallback } from "react";
import { useDictionaryClient } from "@shared/services/dictionary/dictionaryClient.ts";
import { useDictionaryRecordHydrator } from "../../hooks/useDictionaryRecordHydrator.js";
import { sanitizeTerm, prepareLookup, resolveResolvedTerm } from "./dictionaryRequestHelpers.js";
import {
  buildCacheKey,
  tryHydrateCachedVersion,
  buildSuccessResult,
  applyFallbackResult,
} from "./dictionaryCacheUtils.js";

const validateLoadEntryInput = ({ term, userId, popup }) => {
  const normalized = sanitizeTerm(term);
  if (!normalized) {
    return { type: "result", result: { status: "idle", term: "" } };
  }
  if (!userId) {
    popup.showPopup("请先登录");
    return { type: "result", result: { status: "error", term: normalized } };
  }
  return { type: "normalized", normalized };
};

const prepareLoadEntryContext = ({
  term,
  options,
  state,
  languageConfig,
  copyController,
  lookupController,
}) => {
  const context = prepareLookup({
    term,
    options,
    state,
    languageConfig,
    copyController,
    lookupController,
  });
  if (!context.ready) {
    return { type: "result", result: context.result };
  }
  return { type: "context", context };
};

const hydrateInitialCache = ({ context, options, applyRecord, wordStoreApi }) => {
  if (!options.versionId) {
    return null;
  }
  return tryHydrateCachedVersion({
    cacheKey: context.cacheKey,
    versionId: options.versionId,
    applyRecord,
    wordStoreApi,
  });
};

const resolveCacheHit = ({
  cached,
  options,
  context,
  lookupController,
  state,
}) => {
  if (!cached || options.forceNew) {
    return null;
  }
  lookupController.clearActiveLookup();
  state.setLoading(false);
  return buildSuccessResult({
    resolvedTerm: resolveResolvedTerm(cached, context.normalized),
    normalized: context.normalized,
    language: cached.language ?? context.config.language,
    flavor: cached.flavor ?? context.config.flavor,
  });
};

const executeDictionaryFetch = async ({
  dictionaryClient,
  context,
  userId,
  userToken,
  historyCaptureEnabled,
  options,
}) =>
  dictionaryClient.loadEntry({
    term: context.normalized,
    userId,
    token: userToken,
    sourceLanguage: context.preferences.sourceLanguage,
    targetLanguage: context.preferences.targetLanguage,
    flavor: context.preferences.flavor,
    forceNew: options.forceNew,
    versionId: options.versionId,
    captureHistory: historyCaptureEnabled,
  });

const normalizeNetworkResponse = ({
  response,
  context,
  options,
  applyRecord,
  wordStoreApi,
  state,
}) => {
  if (response.error) {
    return {
      type: "error",
      message: response.error.message,
      result: { status: "error", term: context.normalized, error: response.error },
    };
  }

  const detectedLanguage = response.language ?? context.config.language;
  const resolvedFlavor = response.flavor ?? context.config.flavor;
  const resolvedKey = buildCacheKey({
    term: context.normalized,
    language: detectedLanguage,
    flavor: resolvedFlavor,
  });

  if (resolvedKey !== context.cacheKey) {
    state.setCurrentTermKey(resolvedKey);
  }

  const hydrated = tryHydrateCachedVersion({
    cacheKey: resolvedKey,
    versionId: options.versionId,
    applyRecord,
    wordStoreApi,
  });

  const resolvedTerm = hydrated
    ? resolveResolvedTerm(hydrated, context.normalized)
    : applyFallbackResult({
        data: response.data,
        normalized: context.normalized,
        setEntry: state.setEntry,
        setFinalText: state.setFinalText,
        setCurrentTerm: state.setCurrentTerm,
      });

  return {
    type: "success",
    result: buildSuccessResult({
      resolvedTerm,
      normalized: context.normalized,
      language: detectedLanguage,
      flavor: resolvedFlavor,
    }),
  };
};

const isAborted = (controller) => controller.signal.aborted;

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
