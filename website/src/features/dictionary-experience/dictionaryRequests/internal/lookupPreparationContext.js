import { resolveDictionaryConfig, WORD_LANGUAGE_AUTO } from "@shared/utils";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../../dictionaryExperienceViews.js";
import { buildCacheKey } from "./dictionaryCacheUtils.js";
import { sanitizeTerm } from "./termSanitizer.js";

export const normalizeLookupTerm = (term) => sanitizeTerm(term);

export const beginLookupSession = ({ state, copyController, lookupController }) => {
  state.setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
  copyController.resetCopyFeedback();
  state.setLoading(true);
  return lookupController.beginLookup();
};

export const resolveLookupPreferences = ({ options, languageConfig }) => ({
  sourceLanguage: options.language ?? languageConfig.dictionarySourceLanguage,
  targetLanguage: languageConfig.dictionaryTargetLanguage,
  flavor: options.flavor ?? languageConfig.dictionaryFlavor,
});

export const resolveLookupConfig = ({ normalized, preferences }) =>
  resolveDictionaryConfig(normalized, {
    sourceLanguage: preferences.sourceLanguage ?? WORD_LANGUAGE_AUTO,
    targetLanguage: preferences.targetLanguage,
    flavor: preferences.flavor,
  });

export const buildLookupCacheKey = ({ normalized, config }) =>
  buildCacheKey({
    term: normalized,
    language: config.language,
    flavor: config.flavor,
  });

export const shouldResetLookup = ({ state, cacheKey, options }) =>
  state.currentTermKey !== cacheKey || Boolean(options.forceNew);

export const updateLookupState = ({ state, normalized, cacheKey, shouldReset }) => {
  state.setCurrentTerm(normalized);
  state.setCurrentTermKey(cacheKey);
  if (shouldReset) {
    state.setEntry(null);
    state.setFinalText("");
  }
};

const resolveLookupSession = ({ state, copyController, lookupController }) =>
  beginLookupSession({ state, copyController, lookupController });

const resolveLookupPreferencesAndConfig = ({
  normalized,
  options,
  languageConfig,
}) => {
  const preferences = resolveLookupPreferences({ options, languageConfig });
  const config = resolveLookupConfig({ normalized, preferences });
  return { preferences, config };
};

const prepareLookupState = ({ state, normalized, config, options }) => {
  const cacheKey = buildLookupCacheKey({ normalized, config });
  const resetRequired = shouldResetLookup({ state, cacheKey, options });
  updateLookupState({ state, normalized, cacheKey, shouldReset: resetRequired });
  return cacheKey;
};

export const resolveLookupSetup = ({
  normalized,
  options,
  state,
  languageConfig,
  copyController,
  lookupController,
}) => {
  const lookupOptions = options ?? {};
  const controller = resolveLookupSession({ state, copyController, lookupController });
  const { preferences, config } = resolveLookupPreferencesAndConfig({
    normalized,
    options: lookupOptions,
    languageConfig,
  });
  const cacheKey = prepareLookupState({
    state,
    normalized,
    config,
    options: lookupOptions,
  });
  return { controller, preferences, config, cacheKey };
};

export default {
  normalizeLookupTerm,
  beginLookupSession,
  resolveLookupPreferences,
  resolveLookupConfig,
  buildLookupCacheKey,
  shouldResetLookup,
  updateLookupState,
  resolveLookupSetup,
};
