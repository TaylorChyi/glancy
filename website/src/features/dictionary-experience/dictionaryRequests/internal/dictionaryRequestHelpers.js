import { wordCacheKey } from "@shared/api/words.js";
import {
  resolveDictionaryConfig,
  resolveDictionaryFlavor,
  WORD_LANGUAGE_AUTO,
} from "@shared/utils";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../../dictionaryExperienceViews.js";
import { normalizeDictionaryMarkdown } from "../../markdown/dictionaryMarkdownNormalizer.js";
import { coerceResolvedTerm } from "../../hooks/coerceResolvedTerm.js";

export const sanitizeTerm = (value = "") => value.trim();

export const buildCacheKey = ({ term, language, flavor }) =>
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

export const resolveHistorySelection = ({
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

export const prepareLookup = ({
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

export const resolveResolvedTerm = (hydrated, normalized) =>
  coerceResolvedTerm(hydrated?.term, normalized);
