import PropTypes from "prop-types";
import { LanguageLauncher } from "./parts";

const identity = (value) => value;

export const hasOptions = (list) => Array.isArray(list) && list.length > 0;

export const createNormalizer = (fn) =>
  typeof fn === "function" ? fn : identity;

export default function LanguageControls({
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
}) {
  const hasSource = hasOptions(sourceLanguageOptions);
  const hasTarget = hasOptions(targetLanguageOptions);
  if (!hasSource && !hasTarget) {
    return null;
  }

  const canSwap = hasSource && hasTarget && typeof onSwapLanguages === "function";

  return (
    <LanguageLauncher
      sourceLanguage={sourceLanguage}
      sourceLanguageOptions={sourceLanguageOptions}
      sourceLanguageLabel={sourceLanguageLabel}
      onSourceLanguageChange={onSourceLanguageChange}
      targetLanguage={targetLanguage}
      targetLanguageOptions={targetLanguageOptions}
      targetLanguageLabel={targetLanguageLabel}
      onTargetLanguageChange={onTargetLanguageChange}
      onSwapLanguages={canSwap ? onSwapLanguages : undefined}
      swapLabel={swapLabel}
      normalizeSourceLanguage={createNormalizer(normalizeSourceLanguage)}
      normalizeTargetLanguage={createNormalizer(normalizeTargetLanguage)}
      onMenuOpen={onMenuOpen}
    />
  );
}

LanguageControls.propTypes = {
  sourceLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  sourceLanguageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  sourceLanguageLabel: PropTypes.string,
  onSourceLanguageChange: PropTypes.func,
  targetLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  targetLanguageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  targetLanguageLabel: PropTypes.string,
  onTargetLanguageChange: PropTypes.func,
  onSwapLanguages: PropTypes.func,
  swapLabel: PropTypes.string,
  normalizeSourceLanguage: PropTypes.func,
  normalizeTargetLanguage: PropTypes.func,
  onMenuOpen: PropTypes.func,
};

LanguageControls.defaultProps = {
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
