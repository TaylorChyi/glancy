import {
  resolveDictionaryConfig,
  resolveDictionaryFlavor,
  WORD_LANGUAGE_AUTO,
} from "@shared/utils";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../../dictionaryExperienceViews.js";
import { coerceResolvedTerm } from "../../hooks/coerceResolvedTerm.js";
import { buildCacheKey } from "./dictionaryCacheUtils.js";

export const sanitizeTerm = (value = "") => value.trim();

const createLookupConfig = ({ term, sourceLanguage, targetLanguage, flavor }) =>
  resolveDictionaryConfig(term, {
    sourceLanguage: sourceLanguage ?? WORD_LANGUAGE_AUTO,
    targetLanguage,
    flavor,
  });

export const resolveHistorySelection = ({
  strategy,
  identifier,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryFlavor,
}) => {
  const selection = strategy.find(identifier);
  const term = resolveHistoryTerm(identifier, selection);
  if (!term) {
    return null;
  }
  const fallback = buildHistoryFallback({
    term,
    selection,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
  });
  const { language: resolvedLanguage, flavor: resolvedFlavor } =
    resolveHistoryPreferences({
      selection,
      fallback,
      dictionarySourceLanguage,
      dictionaryTargetLanguage,
      dictionaryFlavor,
    });
  const versionId = resolveHistoryVersionId(selection);
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
  const lookupOptions = options ?? {};
  const controller = beginLookupSession({
    state,
    copyController,
    lookupController,
  });
  const preferences = resolveLookupPreferences({
    options: lookupOptions,
    languageConfig,
  });
  const config = createLookupConfig({
    term: normalized,
    ...preferences,
  });
  const cacheKey = buildCacheKeyFromConfig({ normalized, config });
  const shouldReset = shouldResetLookup({
    state,
    cacheKey,
    options: lookupOptions,
  });
  updateLookupState({ state, normalized, cacheKey, shouldReset });
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

function resolveHistoryTerm(identifier, selection) {
  if (typeof identifier === "string") {
    return identifier;
  }
  return selection?.term ?? "";
}

function buildHistoryFallback({
  term,
  selection,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
}) {
  return resolveDictionaryConfig(term, {
    sourceLanguage:
      selection?.language ?? dictionarySourceLanguage ?? WORD_LANGUAGE_AUTO,
    targetLanguage: dictionaryTargetLanguage,
  });
}

function resolveHistoryPreferences({
  selection,
  fallback,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryFlavor,
}) {
  const language = selection?.language ?? fallback.language;
  const flavor =
    selection?.flavor ??
    resolveDictionaryFlavor({
      sourceLanguage: selection?.language ?? dictionarySourceLanguage,
      targetLanguage: dictionaryTargetLanguage,
      resolvedSourceLanguage: fallback.language,
    }) ??
    dictionaryFlavor;
  return { language, flavor };
}

function resolveHistoryVersionId(selection) {
  return (
    selection?.latestVersionId ??
    selection?.versionId ??
    selection?.activeVersionId ??
    null
  );
}

function beginLookupSession({ state, copyController, lookupController }) {
  state.setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
  copyController.resetCopyFeedback();
  state.setLoading(true);
  return lookupController.beginLookup();
}

function resolveLookupPreferences({ options, languageConfig }) {
  return {
    sourceLanguage:
      options.language ?? languageConfig.dictionarySourceLanguage,
    targetLanguage: languageConfig.dictionaryTargetLanguage,
    flavor: options.flavor ?? languageConfig.dictionaryFlavor,
  };
}

function buildCacheKeyFromConfig({ normalized, config }) {
  return buildCacheKey({
    term: normalized,
    language: config.language,
    flavor: config.flavor,
  });
}

function shouldResetLookup({ state, cacheKey, options }) {
  return state.currentTermKey !== cacheKey || Boolean(options.forceNew);
}

function updateLookupState({ state, normalized, cacheKey, shouldReset }) {
  state.setCurrentTerm(normalized);
  state.setCurrentTermKey(cacheKey);
  if (shouldReset) {
    state.setEntry(null);
    state.setFinalText("");
  }
}
