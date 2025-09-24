import PropTypes from "prop-types";
import { memo, useMemo } from "react";
import { TtsButton } from "@/components";
import ThemeIcon from "@/components/ui/Icon";
import { useLanguage } from "@/context";
import { normalizeWordLanguage, WORD_LANGUAGE_AUTO } from "@/utils";
import styles from "./OutputToolbar.module.css";

function OutputToolbar({
  term,
  lang,
  onReoutput,
  disabled,
  versions,
  activeVersionId,
  onNavigate,
  ttsComponent = TtsButton,
  languageMode = WORD_LANGUAGE_AUTO,
  languageOptions = [],
  onLanguageModeChange,
  languageLabel,
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
  const normalizedLanguageMode = normalizeWordLanguage(languageMode);
  const hasLanguageSelector =
    Array.isArray(languageOptions) && languageOptions.length > 0;

  return (
    <div className={styles.toolbar} data-testid="output-toolbar">
      {hasLanguageSelector ? (
        <div
          className={styles["language-select"]}
          role="group"
          aria-label={languageLabel || t.dictionaryLanguageLabel || ""}
        >
          {languageOptions.map(({ value, label, description }) => {
            const optionValue = normalizeWordLanguage(value);
            const isActive = optionValue === normalizedLanguageMode;
            return (
              <button
                key={optionValue}
                type="button"
                className={`${styles["language-option"]} ${
                  isActive ? styles.active : styles.inactive
                }`}
                aria-pressed={isActive}
                onClick={() => onLanguageModeChange?.(optionValue)}
                title={description || undefined}
              >
                <span>{label}</span>
              </button>
            );
          })}
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
  languageMode: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  languageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  onLanguageModeChange: PropTypes.func,
  languageLabel: PropTypes.string,
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
  languageMode: WORD_LANGUAGE_AUTO,
  languageOptions: [],
  onLanguageModeChange: undefined,
  languageLabel: undefined,
};

export default memo(OutputToolbar);
