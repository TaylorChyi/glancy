import PropTypes from "prop-types";
import ThemeIcon from "@/components/ui/Icon";
import LanguageMenu from "./parts/LanguageMenu.jsx";
import styles from "./ChatInput.module.css";

const ICON_SIZE = 20;

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

  return (
    <div className={styles["language-controls"]}>
      <LanguageMenu
        options={sourceLanguageOptions}
        value={sourceLanguage}
        onChange={onSourceLanguageChange}
        ariaLabel={sourceLanguageLabel}
        normalizeValue={normalizeSource}
      />
      {canSwap ? (
        <button
          type="button"
          className={styles["language-swap-button"]}
          onClick={onSwapLanguages}
          aria-label={swapLabel}
          title={swapLabel}
        >
          <ThemeIcon
            name="arrow-right"
            width={ICON_SIZE}
            height={ICON_SIZE}
            aria-hidden="true"
          />
        </button>
      ) : null}
      <LanguageMenu
        options={targetLanguageOptions}
        value={targetLanguage}
        onChange={onTargetLanguageChange}
        ariaLabel={targetLanguageLabel}
        normalizeValue={normalizeTarget}
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
};
