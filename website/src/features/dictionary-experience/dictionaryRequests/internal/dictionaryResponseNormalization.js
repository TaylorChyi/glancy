import { buildCacheKey } from "./dictionaryCacheUtils.js";
import {
  applyFallbackResult,
  buildSuccessResult,
  hydrateCachedRecord,
} from "./dictionaryRequestCache.js";
import { resolveResolvedTerm } from "./dictionaryRequestHelpers.js";

const resolveErrorOutcome = (response, normalized) => {
  if (!response.error) {
    return null;
  }
  return {
    type: "error",
    message: response.error.message,
    result: { status: "error", term: normalized, error: response.error },
  };
};

const resolveResponseMetadata = (response, context) => {
  const language = response.language ?? context.config.language;
  const flavor = response.flavor ?? context.config.flavor;
  const cacheKey = buildCacheKey({
    term: context.normalized,
    language,
    flavor,
  });
  return { language, flavor, cacheKey };
};

const updateCacheKey = (state, expectedKey, originalKey) => {
  if (expectedKey !== originalKey) {
    state.setCurrentTermKey(expectedKey);
  }
};

const resolveTermResult = ({
  cacheKey,
  context,
  options,
  applyRecord,
  wordStoreApi,
  state,
  response,
}) => {
  const hydrated = hydrateCachedRecord({
    cacheKey,
    versionId: options.versionId,
    applyRecord,
    wordStoreApi,
  });
  if (hydrated) {
    return resolveResolvedTerm(hydrated, context.normalized);
  }
  return applyFallbackResult({
    data: response.data,
    normalized: context.normalized,
    state,
  });
};

const buildSuccessOutcome = ({
  context,
  options,
  applyRecord,
  wordStoreApi,
  state,
  response,
  metadata,
}) => {
  const resolvedTerm = resolveTermResult({
    cacheKey: metadata.cacheKey,
    context,
    options,
    applyRecord,
    wordStoreApi,
    state,
    response,
  });
  return {
    type: "success",
    result: buildSuccessResult({
      resolvedTerm,
      normalized: context.normalized,
      language: metadata.language,
      flavor: metadata.flavor,
    }),
  };
};

export const normalizeDictionaryResponse = ({
  response,
  context,
  options,
  applyRecord,
  wordStoreApi,
  state,
}) => {
  const errorOutcome = resolveErrorOutcome(response, context.normalized);
  if (errorOutcome) {
    return errorOutcome;
  }
  const metadata = resolveResponseMetadata(response, context);
  updateCacheKey(state, metadata.cacheKey, context.cacheKey);
  return buildSuccessOutcome({
    context,
    options,
    applyRecord,
    wordStoreApi,
    state,
    response,
    metadata,
  });
};

export default normalizeDictionaryResponse;
