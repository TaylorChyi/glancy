import { resolveDictionaryConfig, WORD_LANGUAGE_AUTO } from "@shared/utils";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../../dictionaryExperienceViews.js";
import { sanitizeTerm } from "./termSanitizer.js";
import { buildCacheKey } from "./dictionaryCacheUtils.js";

const createLookupConfig = ({ term, sourceLanguage, targetLanguage, flavor }) =>
  resolveDictionaryConfig(term, {
    sourceLanguage: sourceLanguage ?? WORD_LANGUAGE_AUTO,
    targetLanguage,
    flavor,
  });

const resolveLookupPreferences = ({ options, languageConfig }) => ({
  sourceLanguage: options.language ?? languageConfig.dictionarySourceLanguage,
  targetLanguage: languageConfig.dictionaryTargetLanguage,
  flavor: options.flavor ?? languageConfig.dictionaryFlavor,
});

const beginLookupSession = ({ state, copyController, lookupController }) => {
  state.setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
  copyController.resetCopyFeedback();
  state.setLoading(true);
  return lookupController.beginLookup();
};

const buildCacheKeyFromConfig = ({ normalized, config }) =>
  buildCacheKey({
    term: normalized,
    language: config.language,
    flavor: config.flavor,
  });

const shouldResetLookup = ({ state, cacheKey, options }) =>
  state.currentTermKey !== cacheKey || Boolean(options.forceNew);

const updateLookupState = ({ state, normalized, cacheKey, shouldReset }) => {
  state.setCurrentTerm(normalized);
  state.setCurrentTermKey(cacheKey);
  if (shouldReset) {
    state.setEntry(null);
    state.setFinalText("");
  }
};

const resolveLookupConfig = ({ normalized, preferences }) =>
  createLookupConfig({
    term: normalized,
    sourceLanguage: preferences.sourceLanguage,
    targetLanguage: preferences.targetLanguage,
    flavor: preferences.flavor,
  });

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
  const config = resolveLookupConfig({ normalized, preferences });
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

export default prepareLookup;
