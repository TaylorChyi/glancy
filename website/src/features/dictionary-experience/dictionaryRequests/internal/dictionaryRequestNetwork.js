import { buildCacheKey } from "./dictionaryCacheUtils.js";
import {
  applyFallbackResult,
  buildSuccessResult,
  hydrateCachedRecord,
} from "./dictionaryRequestCache.js";
import { resolveResolvedTerm } from "./dictionaryRequestHelpers.js";

export const executeDictionaryFetch = async ({
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

export const normalizeNetworkResponse = ({
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

  const hydrated = hydrateCachedRecord({
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
        state,
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

export const isAborted = (controller) => controller.signal.aborted;

export default {
  executeDictionaryFetch,
  normalizeNetworkResponse,
  isAborted,
};
