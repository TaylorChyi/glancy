import PropTypes from "prop-types";

const identity = (value) => value;

export const hasOptions = (list) => Array.isArray(list) && list.length > 0;

const createNormalizer = (fn) => (typeof fn === "function" ? fn : identity);

const languageOptionShape = PropTypes.shape({
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
});

export const languageControlsPropTypes = {
  sourceLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  sourceLanguageOptions: PropTypes.arrayOf(languageOptionShape),
  sourceLanguageLabel: PropTypes.string,
  onSourceLanguageChange: PropTypes.func,
  targetLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  targetLanguageOptions: PropTypes.arrayOf(languageOptionShape),
  targetLanguageLabel: PropTypes.string,
  onTargetLanguageChange: PropTypes.func,
  onSwapLanguages: PropTypes.func,
  swapLabel: PropTypes.string,
  normalizeSourceLanguage: PropTypes.func,
  normalizeTargetLanguage: PropTypes.func,
  onMenuOpen: PropTypes.func,
};

export const languageControlsDefaultProps = {
  sourceLanguage: undefined,
  sourceLanguageOptions: [],
  sourceLanguageLabel: undefined,
  onSourceLanguageChange: undefined,
  targetLanguage: undefined,
  targetLanguageOptions: [],
  targetLanguageLabel: undefined,
  onTargetLanguageChange: undefined,
  onSwapLanguages: undefined,
  swapLabel: undefined,
  normalizeSourceLanguage: undefined,
  normalizeTargetLanguage: undefined,
  onMenuOpen: undefined,
};

export const buildLanguageLauncherProps = (
  {
    sourceLanguage,
    sourceLanguageOptions,
    sourceLanguageLabel,
    onSourceLanguageChange,
    targetLanguage,
    targetLanguageOptions,
    targetLanguageLabel,
    onTargetLanguageChange,
    onSwapLanguages,
    swapLabel,
    normalizeSourceLanguage,
    normalizeTargetLanguage,
    onMenuOpen,
  },
  canSwap,
) => ({
  sourceLanguage,
  sourceLanguageOptions,
  sourceLanguageLabel,
  onSourceLanguageChange,
  targetLanguage,
  targetLanguageOptions,
  targetLanguageLabel,
  onTargetLanguageChange,
  onSwapLanguages: canSwap ? onSwapLanguages : undefined,
  swapLabel,
  normalizeSourceLanguage: createNormalizer(normalizeSourceLanguage),
  normalizeTargetLanguage: createNormalizer(normalizeTargetLanguage),
  onMenuOpen,
});
