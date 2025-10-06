import { useCallback, useMemo } from "react";
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
  sourceLanguage,
  targetLanguage,
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
        className={[styles.segment, active ? styles["segment-active"] : ""]
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
  const flavorKey = typeof flavor === "string" ? flavor.toUpperCase() : "";
  const sourcePreferenceKey =
    typeof sourceLanguage === "string" ? sourceLanguage.toUpperCase() : "";
  const targetPreferenceKey =
    typeof targetLanguage === "string" ? targetLanguage.toUpperCase() : "";

  const languageLabels = useMemo(
    () => ({
      ENGLISH: t.reportLanguageValueEnglish ?? "English",
      CHINESE: t.reportLanguageValueChinese ?? "Chinese",
      AUTO: t.dictionarySourceLanguageAuto ?? "Auto",
    }),
    [
      t.reportLanguageValueEnglish,
      t.reportLanguageValueChinese,
      t.dictionarySourceLanguageAuto,
    ],
  );

  const resolvedLanguageLabel =
    languageLabels[languageKey] ?? language ?? "";

  // 词典模式展示需要呈现具体语言方向；在用户选择“自动检测”时，
  // 回退到当前词条识别的语言，并基于口味选择推断默认方向。
  const resolvedSourceKey = (() => {
    if (sourcePreferenceKey && sourcePreferenceKey !== "AUTO") {
      return sourcePreferenceKey;
    }
    if (languageKey) {
      return languageKey;
    }
    if (flavorKey === "MONOLINGUAL_CHINESE") {
      return "CHINESE";
    }
    return "ENGLISH";
  })();

  const resolvedTargetKey = (() => {
    if (targetPreferenceKey) {
      return targetPreferenceKey;
    }
    if (flavorKey === "MONOLINGUAL_ENGLISH") {
      return "ENGLISH";
    }
    if (flavorKey === "MONOLINGUAL_CHINESE") {
      return "CHINESE";
    }
    if (resolvedSourceKey === "ENGLISH") {
      return "CHINESE";
    }
    return "ENGLISH";
  })();

  const dictionaryModeLabel = useMemo(() => {
    const sourceLabel = languageLabels[resolvedSourceKey] ?? resolvedSourceKey;
    const targetLabel = languageLabels[resolvedTargetKey] ?? resolvedTargetKey;
    if (!targetLabel) {
      return sourceLabel;
    }
    return `${sourceLabel} → ${targetLabel}`;
  }, [languageLabels, resolvedSourceKey, resolvedTargetKey]);

  const summaryItems = useMemo(
    () =>
      [
        {
          key: "term",
          label: t.reportTermLabel ?? "Term",
          value: term,
        },
        language
          ? {
              key: "language",
              label: t.reportLanguageLabel ?? "Language",
              value: resolvedLanguageLabel,
            }
          : null,
        dictionaryModeLabel
          ? {
              key: "dictionary-mode",
              label: t.reportFlavorLabel ?? "Dictionary",
              value: dictionaryModeLabel,
            }
          : null,
      ].filter(Boolean),
    [
      dictionaryModeLabel,
      language,
      resolvedLanguageLabel,
      t.reportFlavorLabel,
      t.reportLanguageLabel,
      t.reportTermLabel,
      term,
    ],
  );

  return (
    <BaseModal open={open} onClose={onClose} className="modal-content">
      <SettingsSurface
        as="form"
        onSubmit={handleSubmit}
        title={t.reportTitle ?? "Report an issue"}
        actions={
          <div className={styles["action-bar"]}>
            {/*
             * 通过占满 actions 区域来与 SettingsSurface 保持左右对齐的栅格节奏，
             * 既方便在左侧展示错误消息，也能在右侧维持操作按钮的视觉稳定。
             */}
            <div
              className={styles["action-status"]}
              aria-live="assertive"
              aria-atomic="true"
            >
              {error ? (
                <p className={styles.error} role="alert">
                  {t.reportErrorMessage ?? error}
                </p>
              ) : null}
            </div>
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
        className={styles["plain-surface"]}
      >
        <dl className={styles.summary}>
          {summaryItems.map((item) => (
            <div key={item.key} className={styles["summary-item"]}>
              <dt className={styles["summary-label"]}>{item.label}</dt>
              <dd className={styles["summary-value"]}>{item.value}</dd>
            </div>
          ))}
        </dl>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>
            {t.reportCategoryLabel ?? "Issue type"}
          </legend>
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
  sourceLanguage: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.oneOf([null]),
  ]),
  targetLanguage: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.oneOf([null]),
  ]),
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
  sourceLanguage: null,
  targetLanguage: null,
};

export default ReportIssueModal;
