import { normalizeDictionaryMarkdown } from "../../markdown/dictionaryMarkdownNormalizer.js";
import { resolveResolvedTerm } from "./dictionaryRequestHelpers.js";

export const getCachedRecord = (cacheKey, wordStoreApi) => {
  if (!cacheKey) return null;
  return wordStoreApi.getState().getRecord?.(cacheKey) ?? null;
};

export const hydrateCachedRecord = ({
  cacheKey,
  versionId,
  applyRecord,
  wordStoreApi,
}) => {
  const cached = getCachedRecord(cacheKey, wordStoreApi);
  if (!cached) {
    return null;
  }
  return applyRecord(cacheKey, cached, versionId ?? cached.activeVersionId);
};

export const hydrateInitialCache = ({
  context,
  options,
  applyRecord,
  wordStoreApi,
}) => {
  if (!options.versionId) {
    return null;
  }
  return hydrateCachedRecord({
    cacheKey: context.cacheKey,
    versionId: options.versionId,
    applyRecord,
    wordStoreApi,
  });
};

export const buildSuccessResult = ({ resolvedTerm, normalized, language, flavor }) => ({
  status: "success",
  term: resolvedTerm,
  queriedTerm: normalized,
  detectedLanguage: language,
  flavor,
});

const normalizeFallbackEntry = (data) => {
  if (!data || typeof data !== "object") return null;
  return {
    ...data,
    markdown: normalizeDictionaryMarkdown(data.markdown ?? ""),
  };
};

export const applyFallbackResult = ({ data, normalized, state }) => {
  const entry = normalizeFallbackEntry(data);
  if (!entry) {
    state.setEntry(null);
    state.setFinalText("");
    state.setCurrentTerm(normalized);
    return normalized;
  }

  state.setEntry(entry);
  state.setFinalText(entry.markdown ?? "");
  const resolvedTerm = entry.term ?? normalized;
  state.setCurrentTerm(resolvedTerm);
  return resolvedTerm;
};

export const resolveCacheHit = ({
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

export default {
  getCachedRecord,
  hydrateCachedRecord,
  hydrateInitialCache,
  buildSuccessResult,
  applyFallbackResult,
  resolveCacheHit,
};
