import { wordCacheKey } from "@shared/api/words.js";
import { normalizeDictionaryMarkdown } from "../../markdown/dictionaryMarkdownNormalizer.js";

export const buildCacheKey = ({ term, language, flavor }) =>
  wordCacheKey({ term, language, flavor });

export const tryHydrateCachedVersion = ({
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

export const buildSuccessResult = ({
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

export const applyFallbackResult = ({
  data,
  normalized,
  setEntry,
  setFinalText,
  setCurrentTerm,
}) => {
  const entry = buildFallbackEntry(data);
  if (!entry) {
    resetFallbackState({ setEntry, setFinalText, setCurrentTerm, normalized });
    return normalized;
  }
  return commitFallbackEntry({
    entry,
    normalized,
    setEntry,
    setFinalText,
    setCurrentTerm,
  });
};

const buildFallbackEntry = (data) => {
  if (!data || typeof data !== "object") return null;
  return {
    ...data,
    markdown: normalizeDictionaryMarkdown(data.markdown ?? ""),
  };
};

const resetFallbackState = ({ setEntry, setFinalText, setCurrentTerm, normalized }) => {
  setEntry(null);
  setFinalText("");
  setCurrentTerm(normalized);
};

const commitFallbackEntry = ({
  entry,
  normalized,
  setEntry,
  setFinalText,
  setCurrentTerm,
}) => {
  setEntry(entry);
  setFinalText(entry.markdown ?? "");
  const resolvedTerm = entry.term ?? normalized;
  setCurrentTerm(resolvedTerm);
  return resolvedTerm;
};
