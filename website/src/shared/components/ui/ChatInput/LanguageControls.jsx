import PropTypes from "prop-types";
import { LanguageMenu } from "./parts";
import styles from "./styles/index.js";

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
  const hasSource = Array.isArray(sourceLanguageOptions)
    ? sourceLanguageOptions.length > 0
    : false;
  const hasTarget = Array.isArray(targetLanguageOptions)
    ? targetLanguageOptions.length > 0
    : false;

  if (!hasSource && !hasTarget) {
    return null;
  }

  const canSwap =
    hasSource && hasTarget && typeof onSwapLanguages === "function";
  const normalizeSource =
    typeof normalizeSourceLanguage === "function"
      ? normalizeSourceLanguage
      : (value) => value;
  const normalizeTarget =
    typeof normalizeTargetLanguage === "function"
      ? normalizeTargetLanguage
      : (value) => value;

  const groupLabel =
    [sourceLanguageLabel, targetLanguageLabel].filter(Boolean).join(" → ") ||
    "language selection";

  return (
    <div
      className={styles["language-shell"]}
      role="group"
      aria-label={groupLabel}
    >
      <LanguageMenu
        options={sourceLanguageOptions}
        value={sourceLanguage}
        onChange={onSourceLanguageChange}
        ariaLabel={sourceLanguageLabel}
        normalizeValue={normalizeSource}
        showLabel={false}
        variant="source"
        onOpen={
          typeof onMenuOpen === "function"
            ? () => onMenuOpen("source")
            : undefined
        }
      />
      {canSwap ? (
        <button
          type="button"
          className={styles["language-swap"]}
          onClick={onSwapLanguages}
          aria-label={swapLabel}
          title={swapLabel}
        >
          →
        </button>
      ) : (
        <span className={styles["language-arrow"]} aria-hidden="true">
          →
        </span>
      )}
      <LanguageMenu
        options={targetLanguageOptions}
        value={targetLanguage}
        onChange={onTargetLanguageChange}
        ariaLabel={targetLanguageLabel}
        normalizeValue={normalizeTarget}
        showLabel={false}
        variant="target"
        onOpen={
          typeof onMenuOpen === "function"
            ? () => onMenuOpen("target")
            : undefined
        }
      />
    </div>
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
