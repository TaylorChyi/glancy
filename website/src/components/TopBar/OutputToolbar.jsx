import PropTypes from "prop-types";
import { memo, useMemo } from "react";
import { TtsButton } from "@/components";
import ThemeIcon from "@/components/ui/Icon";
import { useLanguage } from "@/context";
import {
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
  WORD_LANGUAGE_AUTO,
  WORD_DEFAULT_TARGET_LANGUAGE,
} from "@/utils";
import styles from "./OutputToolbar.module.css";

function LanguageGroup({
  label,
  options,
  value,
  onChange,
  normalizeValue,
  type,
}) {
  const normalizedOptions = Array.isArray(options)
    ? options.map(({ value: optionValue, label: optionLabel, description }) => {
        const normalizedOption = normalizeValue?.(optionValue) ?? optionValue;
        const normalizedString =
          normalizedOption != null ? String(normalizedOption) : "";
        return {
          value: normalizedString,
          label: optionLabel,
          description,
        };
      })
    : [];

  if (normalizedOptions.length === 0) {
    return null;
  }

  const resolvedValue = normalizeValue?.(value) ?? value;
  const normalizedValue =
    resolvedValue != null ? String(resolvedValue) : undefined;
  const selectValue = normalizedOptions.some(
    ({ value: optionValue }) => optionValue === normalizedValue,
  )
    ? normalizedValue
    : (normalizedOptions[0]?.value ?? "");
  const activeOption = normalizedOptions.find(
    ({ value: optionValue }) => optionValue === selectValue,
  );
  const baseId = `dictionary-${type}-language`;
  const descriptionId = activeOption?.description
    ? `${baseId}-description`
    : undefined;

  const handleChange = (event) => {
    const selectedValue = event?.target?.value;
    const normalizedSelection =
      normalizeValue?.(selectedValue) ?? selectedValue;
    onChange?.(normalizedSelection);
  };

  return (
    <div className={styles["language-group"]}>
      {label ? (
        <label className={styles["language-label"]} htmlFor={baseId}>
          {label}
        </label>
      ) : null}
      <div className={styles["select-control"]}>
        <select
          id={baseId}
          className={styles.select}
          value={selectValue}
          onChange={handleChange}
          aria-describedby={descriptionId}
        >
          {normalizedOptions.map(
            ({ value: optionValue, label: optionLabel }) => (
              <option key={optionValue || optionLabel} value={optionValue}>
                {optionLabel}
              </option>
            ),
          )}
        </select>
      </div>
      {activeOption?.description ? (
        <p className={styles["option-description"]} id={descriptionId}>
          {activeOption.description}
        </p>
      ) : null}
    </div>
  );
}

LanguageGroup.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  onChange: PropTypes.func,
  normalizeValue: PropTypes.func,
  type: PropTypes.string.isRequired,
};

LanguageGroup.defaultProps = {
  label: undefined,
  options: [],
  value: undefined,
  onChange: undefined,
  normalizeValue: undefined,
};

function OutputToolbar({
  term,
  lang,
  onReoutput,
  disabled,
  versions,
  activeVersionId,
  onNavigate,
  ttsComponent = TtsButton,
  sourceLanguage = WORD_LANGUAGE_AUTO,
  sourceLanguageOptions = [],
  onSourceLanguageChange,
  sourceLanguageLabel,
  targetLanguage,
  targetLanguageOptions = [],
  onTargetLanguageChange,
  targetLanguageLabel,
}) {
  const { t } = useLanguage();
  const TtsComponent = ttsComponent;
  const { currentIndex, total } = useMemo(() => {
    if (!Array.isArray(versions) || versions.length === 0) {
      return { currentIndex: 0, total: 0 };
    }
    const resolvedIndex = versions.findIndex(
      (item) => String(item.id) === String(activeVersionId),
    );
    const index = resolvedIndex >= 0 ? resolvedIndex + 1 : versions.length;
    return { currentIndex: index, total: versions.length };
  }, [versions, activeVersionId]);

  const hasPrevious = total > 1 && currentIndex > 1;
  const hasNext = total > 1 && currentIndex < total;
  const indicator = total
    ? (t.versionIndicator || "{current}/{total}")
        .replace("{current}", String(currentIndex))
        .replace("{total}", String(total))
    : t.versionIndicatorEmpty || "0/0";
  const speakableTerm = typeof term === "string" ? term.trim() : term;
  const showTts = Boolean(speakableTerm);
  const normalizedSourceLanguage = normalizeWordSourceLanguage(sourceLanguage);
  const normalizedTargetLanguage = normalizeWordTargetLanguage(targetLanguage);
  const showSourceSelector =
    Array.isArray(sourceLanguageOptions) && sourceLanguageOptions.length > 0;
  const showTargetSelector =
    Array.isArray(targetLanguageOptions) && targetLanguageOptions.length > 0;
  const hasLanguageSelector = showSourceSelector || showTargetSelector;

  return (
    <div className={styles.toolbar} data-testid="output-toolbar">
      {hasLanguageSelector ? (
        <div className={styles["language-select"]}>
          {showSourceSelector ? (
            <LanguageGroup
              type="source"
              label={sourceLanguageLabel || t.dictionarySourceLanguageLabel}
              options={sourceLanguageOptions}
              value={normalizedSourceLanguage}
              onChange={onSourceLanguageChange}
              normalizeValue={normalizeWordSourceLanguage}
            />
          ) : null}
          {showTargetSelector ? (
            <LanguageGroup
              type="target"
              label={targetLanguageLabel || t.dictionaryTargetLanguageLabel}
              options={targetLanguageOptions}
              value={normalizedTargetLanguage}
              onChange={onTargetLanguageChange}
              normalizeValue={normalizeWordTargetLanguage}
            />
          ) : null}
        </div>
      ) : null}
      {showTts ? (
        <TtsComponent
          text={term}
          lang={lang}
          size={20}
          disabled={!speakableTerm}
        />
      ) : null}
      <button
        type="button"
        className={styles.replay}
        onClick={onReoutput}
        disabled={disabled || !speakableTerm}
        aria-label={t.reoutput}
      >
        <ThemeIcon name="refresh" width={16} height={16} aria-hidden="true" />
        <span>{t.reoutput}</span>
      </button>
      <div className={styles["version-controls"]}>
        <button
          type="button"
          className={styles["nav-button"]}
          onClick={() => onNavigate?.("previous")}
          disabled={!hasPrevious}
          aria-label={t.previousVersion}
        >
          <ThemeIcon
            name="arrow-left"
            width={14}
            height={14}
            aria-hidden="true"
          />
        </button>
        <span className={styles.indicator}>{indicator}</span>
        <button
          type="button"
          className={styles["nav-button"]}
          onClick={() => onNavigate?.("next")}
          disabled={!hasNext}
          aria-label={t.nextVersion}
        >
          <ThemeIcon
            name="arrow-right"
            width={14}
            height={14}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}

OutputToolbar.propTypes = {
  term: PropTypes.string,
  lang: PropTypes.string,
  onReoutput: PropTypes.func,
  disabled: PropTypes.bool,
  versions: PropTypes.arrayOf(PropTypes.object),
  activeVersionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onNavigate: PropTypes.func,
  ttsComponent: PropTypes.elementType,
  sourceLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  sourceLanguageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  onSourceLanguageChange: PropTypes.func,
  sourceLanguageLabel: PropTypes.string,
  targetLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  targetLanguageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  onTargetLanguageChange: PropTypes.func,
  targetLanguageLabel: PropTypes.string,
};

OutputToolbar.defaultProps = {
  term: "",
  lang: "en",
  onReoutput: undefined,
  disabled: false,
  versions: [],
  activeVersionId: undefined,
  onNavigate: undefined,
  ttsComponent: TtsButton,
  sourceLanguage: WORD_LANGUAGE_AUTO,
  sourceLanguageOptions: [],
  onSourceLanguageChange: undefined,
  sourceLanguageLabel: undefined,
  targetLanguage: WORD_DEFAULT_TARGET_LANGUAGE,
  targetLanguageOptions: [],
  onTargetLanguageChange: undefined,
  targetLanguageLabel: undefined,
};

export default memo(OutputToolbar);
