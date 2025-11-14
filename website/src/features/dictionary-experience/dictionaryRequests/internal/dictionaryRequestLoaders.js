import { useCallback, useMemo } from "react";
import { useDictionaryClient } from "@shared/services/dictionary/dictionaryClient.ts";
import { useDictionaryRecordHydrator } from "../../hooks/useDictionaryRecordHydrator.js";
import { hydrateCachedRecord } from "./dictionaryRequestCache.js";
import { resolveValidatedContext } from "./dictionaryLoadEntryContext.js";
import { resolveCacheOrNetwork } from "./dictionaryLoadEntryNetwork.js";

const useApplyRecordHydrator = ({ state, wordStoreApi }) =>
  useDictionaryRecordHydrator({
    wordStoreApi,
    setEntry: state.setEntry,
    setFinalText: state.setFinalText,
    setCurrentTerm: state.setCurrentTerm,
  });

const useHydrateRecordHandler = ({ applyRecord, wordStoreApi }) =>
  useCallback(
    (termKey, preferredVersionId) =>
      hydrateCachedRecord({
        cacheKey: termKey,
        versionId: preferredVersionId,
        applyRecord,
        wordStoreApi,
      }),
    [applyRecord, wordStoreApi],
  );

const buildValidationParams = (params) => ({
  term: params.term,
  options: params.options,
  userId: params.userId,
  popup: params.popup,
  state: params.state,
  languageConfig: params.languageConfig,
  copyController: params.copyController,
  lookupController: params.lookupController,
});

const buildNetworkParams = (params, context) => ({
  context,
  options: params.options,
  applyRecord: params.applyRecord,
  wordStoreApi: params.wordStoreApi,
  lookupController: params.lookupController,
  state: params.state,
  dictionaryClient: params.dictionaryClient,
  userId: params.userId,
  userToken: params.userToken,
  historyCaptureEnabled: params.historyCaptureEnabled,
  popup: params.popup,
});

const performLoadEntry = (params) => {
  const contextResolution = resolveValidatedContext(buildValidationParams(params));
  if (contextResolution.result) {
    return contextResolution.result;
  }
  return resolveCacheOrNetwork(
    buildNetworkParams(params, contextResolution.context),
  );
};

const useLoadEntryHandler = ({
  dictionaryClient, userId, userToken, historyCaptureEnabled,
  popup, state, languageConfig, copyController,
  lookupController, applyRecord, wordStoreApi,
}) => {
  const baseParams = useMemo(
    () => ({
      dictionaryClient,
      userId,
      userToken,
      historyCaptureEnabled,
      popup,
      state,
      languageConfig,
      copyController,
      lookupController,
      applyRecord,
      wordStoreApi,
    }),
    [
      dictionaryClient, userId, userToken, historyCaptureEnabled,
      popup, state, languageConfig, copyController,
      lookupController, applyRecord, wordStoreApi,
    ],
  );
  return useCallback(
    (term, options = {}) => performLoadEntry({ term, options, ...baseParams }),
    [baseParams],
  );
};

const performFetchExamples = ({
  term,
  dictionaryClient,
  userId,
  userToken,
  sourceLanguage,
  targetLanguage,
  flavor,
}) => {
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
    sourceLanguage,
    targetLanguage,
    flavor,
  });
};

const useFetchExamplesHandler = (params) => {
  const { dictionaryClient, userId, userToken, languageConfig } = params;
  const sourceLanguage = languageConfig.dictionarySourceLanguage;
  const targetLanguage = languageConfig.dictionaryTargetLanguage;
  const flavor = languageConfig.dictionaryFlavor;
  const handlerParams = useMemo(
    () => ({
      dictionaryClient,
      userId,
      userToken,
      sourceLanguage,
      targetLanguage,
      flavor,
    }),
    [
      dictionaryClient,
      userId,
      userToken,
      sourceLanguage,
      targetLanguage,
      flavor,
    ],
  );
  return useCallback(
    (term) => performFetchExamples({ term, ...handlerParams }),
    [handlerParams],
  );
};

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
  const baseParams = {
    dictionaryClient,
    userId: user?.id ?? "",
    userToken: user?.token ?? "",
    historyCaptureEnabled,
    popup,
    state,
    languageConfig,
    copyController,
    lookupController,
    wordStoreApi,
  };
  const applyRecord = useApplyRecordHydrator({ state, wordStoreApi });
  const hydrateRecord = useHydrateRecordHandler({ applyRecord, wordStoreApi });
  const loadEntry = useLoadEntryHandler({ ...baseParams, applyRecord });
  const fetchExamples = useFetchExamplesHandler(baseParams);
  return { loadEntry, fetchExamples, hydrateRecord, applyRecord };
};

export default useDictionaryRequestLoaders;
