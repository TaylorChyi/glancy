import { useCallback } from "react";
import PropTypes from "prop-types";
import BaseModal from "@/components/modals/BaseModal.jsx";
import { SettingsSurface } from "@/components";
import { useLanguage } from "@/context";
import styles from "./ReportIssueModal.module.css";

/**
 * 背景：
 *  - 举报弹窗需复用 SettingsSurface 的视觉语言，以保持界面一致性。
 * 目的：
 *  - 封装举报表单的展示与交互，向上暴露纯粹的受控属性。
 * 关键决策与取舍：
 *  - 采用 form+SettingsSurface 组合，让键盘导航顺序与设置面板一致；
 *  - 将提交逻辑交给父级 hook，组件仅负责事件派发与无障碍语义。
 */
function ReportIssueModal({
  open,
  term,
  language,
  flavor,
  category,
  categories,
  description,
  submitting,
  error,
  onClose,
  onCategoryChange,
  onDescriptionChange,
  onSubmit,
}) {
  const { t } = useLanguage();

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (submitting) return;
      onSubmit?.();
    },
    [onSubmit, submitting],
  );

  const renderCategoryOption = (option) => {
    const active = category === option.value;
    return (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={active}
        className={[
          styles.segment,
          active ? styles["segment-active"] : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => onCategoryChange(option.value)}
        disabled={submitting}
      >
        {t[option.labelKey] ?? option.value}
      </button>
    );
  };

  const languageKey = typeof language === "string" ? language.toUpperCase() : "";
  const languageLabels = {
    ENGLISH: t.reportLanguageValueEnglish ?? "English",
    CHINESE: t.reportLanguageValueChinese ?? "Chinese",
  };
  const resolvedLanguageLabel = languageLabels[languageKey] ?? language ?? "";

  const flavorKey = typeof flavor === "string" ? flavor.toUpperCase() : "";
  const flavorLabels = {
    BILINGUAL: t.reportFlavorValueBilingual ?? "Bilingual", // default flavor
    MONOLINGUAL_ENGLISH:
      t.reportFlavorValueMonolingualEnglish ?? "English only",
    MONOLINGUAL_CHINESE:
      t.reportFlavorValueMonolingualChinese ?? "Chinese only",
  };
  const resolvedFlavorLabel = flavorLabels[flavorKey] ?? flavor ?? "";

  return (
    <BaseModal open={open} onClose={onClose} className="modal-content">
      <SettingsSurface
        as="form"
        onSubmit={handleSubmit}
        title={t.reportTitle ?? "Report an issue"}
        description={t.reportDescription ?? "Describe the problem with this entry."}
        actions={
          <div className={styles["action-row"]}>
            {error ? (
              <p className={styles.error} role="alert">
                {t.reportErrorMessage ?? error}
              </p>
            ) : null}
            <div className={styles["action-buttons"]}>
              <button
                type="button"
                onClick={onClose}
                className={styles["ghost-button"]}
                disabled={submitting}
              >
                {t.reportCancel ?? t.cancel ?? "Cancel"}
              </button>
              <button
                type="submit"
                className={styles["primary-button"]}
                disabled={submitting}
              >
                {submitting
                  ? t.reportSubmitting ?? t.loading ?? "Submitting"
                  : t.reportSubmit ?? "Submit"}
              </button>
            </div>
          </div>
        }
      >
        <dl className={styles.summary}>
          <div className={styles["summary-item"]}>
            <dt className={styles["summary-label"]}>
              {t.reportTermLabel ?? "Term"}
            </dt>
            <dd className={styles["summary-value"]}>{term}</dd>
          </div>
          {language ? (
            <div className={styles["summary-item"]}>
              <dt className={styles["summary-label"]}>
                {t.reportLanguageLabel ?? "Language"}
              </dt>
              <dd className={styles["summary-value"]}>{resolvedLanguageLabel}</dd>
            </div>
          ) : null}
          {flavor ? (
            <div className={styles["summary-item"]}>
              <dt className={styles["summary-label"]}>
                {t.reportFlavorLabel ?? "Dictionary"}
              </dt>
              <dd className={styles["summary-value"]}>{resolvedFlavorLabel}</dd>
            </div>
          ) : null}
        </dl>
        <fieldset className={styles.fieldset} aria-describedby="report-category-hint">
          <legend className={styles.legend}>
            {t.reportCategoryLabel ?? "Issue type"}
          </legend>
          <div
            id="report-category-hint"
            className={styles["field-hint"]}
            aria-live="polite"
          >
            {t.reportCategoryHint ?? "Select the most relevant option."}
          </div>
          <div role="radiogroup" className={styles["segment-group"]}>
            {categories.map(renderCategoryOption)}
          </div>
        </fieldset>
        <div className={styles.fieldset}>
          <label htmlFor="report-description" className={styles.legend}>
            {t.reportDescriptionLabel ?? "Details"}
          </label>
          <textarea
            id="report-description"
            className={styles.textarea}
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder={
              t.reportDescriptionPlaceholder ?? "Tell us more (optional)"
            }
            rows={4}
            disabled={submitting}
          />
        </div>
      </SettingsSurface>
    </BaseModal>
  );
}

ReportIssueModal.propTypes = {
  open: PropTypes.bool.isRequired,
  term: PropTypes.string.isRequired,
  language: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
  flavor: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
  category: PropTypes.string.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      labelKey: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  description: PropTypes.string.isRequired,
  submitting: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

ReportIssueModal.defaultProps = {
  submitting: false,
  error: "",
  language: null,
  flavor: null,
};

export default ReportIssueModal;
