import PropTypes from "prop-types";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./ChatInput.module.css";

const toNormalizedOptions = (options, normalizeValue) => {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map(({ value, label }) => {
      if (typeof label !== "string") {
        return null;
      }

      const normalized = normalizeValue?.(value);
      const resolved = normalized ?? value;
      const stringValue =
        resolved != null ? String(resolved).toUpperCase() : undefined;

      if (!stringValue) {
        return null;
      }

      return {
        value: stringValue,
        label,
      };
    })
    .filter(Boolean);
};

function LanguageSelect({
  options,
  value,
  onChange,
  ariaLabel,
  normalizeValue,
}) {
  const normalizedOptions = toNormalizedOptions(options, normalizeValue);

  if (normalizedOptions.length === 0) {
    return null;
  }

  const normalizedValue = normalizeValue?.(value) ?? value;
  const resolvedValue =
    normalizedValue != null ? String(normalizedValue).toUpperCase() : undefined;

  const selectValue = normalizedOptions.some(
    (option) => option.value === resolvedValue,
  )
    ? resolvedValue
    : normalizedOptions[0]?.value;

  const handleChange = (event) => {
    const selected = event?.target?.value;
    const normalized = normalizeValue?.(selected) ?? selected;
    onChange?.(normalized);
  };

  return (
    <div className={styles["language-select-wrapper"]}>
      <select
        className={styles["language-select"]}
        value={selectValue}
        onChange={handleChange}
        aria-label={ariaLabel}
      >
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

LanguageSelect.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
    }),
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  onChange: PropTypes.func,
  ariaLabel: PropTypes.string,
  normalizeValue: PropTypes.func,
};

LanguageSelect.defaultProps = {
  options: [],
  value: undefined,
  onChange: undefined,
  ariaLabel: undefined,
  normalizeValue: undefined,
};

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
      <LanguageSelect
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
            width={18}
            height={18}
            aria-hidden="true"
          />
        </button>
      ) : null}
      <LanguageSelect
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
    }),
  ),
  sourceLanguageLabel: PropTypes.string,
  onSourceLanguageChange: PropTypes.func,
  targetLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  targetLanguageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
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
