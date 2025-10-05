/**
 * 背景：
 *  - 偏好设置中的数据分区长期以占位呈现，无法承接历史留存、清理与导出等治理诉求。
 * 目的：
 *  - 通过组合 + 命令策略模式，将历史采集开关、保留窗口、按语言清理与导出等动作集中在一个可复用的面板中；
 *    Store 负责状态持久化，组件负责编排命令执行，保证后续接入后端 API 时仅需替换命令实现。
 * 关键决策与取舍：
 *  - 采用 Segmented + 行为按钮的组合布局，复用既有样式令牌确保视觉一致；
 *  - 动作执行通过局部 pending 状态串联，避免全局 Loading 阻塞其他设置操作；
 *  - 导出功能以内联 JSON 导出实现，待服务端导出接口上线后可替换命令实现而无需改动 UI。
 * 影响范围：
 *  - Preferences 页面与 SettingsModal 的 “Data” 分区；
 *  - historyStore 新增按语言清理与保留策略命令。
 * 演进与TODO：
 *  - TODO: 接入后端批量删除/导出接口后，将命令执行替换为服务端调用并增加反馈提示；
 *  - TODO: 根据隐私政策需要，可在此扩展审计日志下载或多租户策略展示。
 */
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useLanguage, useUser } from "@/context";
import LanguageMenu from "@/components/ui/LanguageMenu";
import { useDataGovernanceStore, useHistoryStore } from "@/store";
import {
  DATA_RETENTION_POLICIES,
  getRetentionPolicyById,
} from "@/store/dataGovernanceStore";
import styles from "../Preferences.module.css";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

const mapHistoryLanguageLabel = (translations, language) => {
  const normalized = String(language ?? "").toUpperCase();
  if (normalized === "ENGLISH") {
    return (
      translations.dictionaryTargetLanguageEnglish ??
      translations.dictionarySourceLanguageEnglish ??
      "English"
    );
  }
  if (normalized === "CHINESE") {
    return (
      translations.dictionaryTargetLanguageChinese ??
      translations.dictionarySourceLanguageChinese ??
      "Chinese"
    );
  }
  return normalized;
};

const toLanguageOptions = (history, translations) => {
  const unique = new Set(
    history
      .map((item) => item.language)
      .filter((value) => typeof value === "string" && value.trim().length > 0),
  );
  return Array.from(unique)
    .map((language) => ({
      value: String(language).toUpperCase(),
      label: mapHistoryLanguageLabel(translations, language),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

function DataSection({ title, message, headingId, descriptionId }) {
  const { t } = useLanguage();
  const userStore = useUser();
  const user = userStore?.user;

  const {
    historyCaptureEnabled,
    retentionPolicyId,
    setHistoryCaptureEnabled,
    setRetentionPolicy,
  } = useDataGovernanceStore((state) => ({
    historyCaptureEnabled: state.historyCaptureEnabled,
    retentionPolicyId: state.retentionPolicyId,
    setHistoryCaptureEnabled: state.setHistoryCaptureEnabled,
    setRetentionPolicy: state.setRetentionPolicy,
  }));

  const {
    history,
    clearHistory,
    clearHistoryByLanguage,
    applyRetentionPolicy,
  } = useHistoryStore((state) => ({
    history: state.history,
    clearHistory: state.clearHistory,
    clearHistoryByLanguage: state.clearHistoryByLanguage,
    applyRetentionPolicy: state.applyRetentionPolicy,
  }));

  const sectionDescription =
    message?.trim() ||
    t.settingsDataDescription ||
    "Manage your historical traces across Glancy.";

  const toggleLabel = t.settingsDataHistoryToggleLabel || "History collection";
  const toggleDescription =
    t.settingsDataHistoryToggleDescription ||
    "Decide whether Glancy keeps new lookups for quick recall.";
  const toggleOnLabel = t.settingsDataHistoryToggleOn || "Capture history";
  const toggleOffLabel = t.settingsDataHistoryToggleOff || "Pause history";

  const retentionLabel = t.settingsDataRetentionLabel || "Retention window";
  const retentionDescription =
    t.settingsDataRetentionDescription ||
    "Choose how long records stay before we prune them.";

  const languageLabel = t.settingsDataLanguageLabel || "Language history";
  const languagePlaceholder =
    t.settingsDataClearLanguagePlaceholder || "No language history yet";

  const actionsLabel = t.settingsDataActionsLabel || "Data actions";
  const clearAllLabel = t.settingsDataClearAll || "Erase all history";
  const clearLanguageLabel =
    t.settingsDataClearLanguage || "Clear selected language";
  const exportLabel = t.settingsDataExport || "Export data";
  const exportDescription =
    t.settingsDataExportDescription ||
    "Download a JSON snapshot of your preferences and history.";
  const exportFileName = t.settingsDataExportFileName || "glancy-data-export";

  const fallbackDescriptionId = useId();
  const sectionDescriptionId = descriptionId ?? fallbackDescriptionId;
  const toggleFieldId = useId();
  const retentionFieldId = useId();
  const languageFieldId = useId();

  const [pendingAction, setPendingAction] = useState("");
  const retentionOptions = useMemo(
    () =>
      DATA_RETENTION_POLICIES.map((policy) => ({
        ...policy,
        label:
          t[`settingsDataRetentionOption_${policy.id}`] ||
          `${policy.days ?? "∞"} days`,
      })),
    [t],
  );

  const selectedPolicy = useMemo(
    () => getRetentionPolicyById(retentionPolicyId) ?? null,
    [retentionPolicyId],
  );

  const languageOptions = useMemo(
    () => toLanguageOptions(history, t),
    [history, t],
  );

  const [selectedLanguage, setSelectedLanguage] = useState(
    languageOptions[0]?.value ?? "",
  );

  useEffect(() => {
    if (languageOptions.length === 0) {
      setSelectedLanguage("");
      return;
    }
    const exists = languageOptions.some(
      (option) => option.value === selectedLanguage,
    );
    if (!exists) {
      setSelectedLanguage(languageOptions[0].value);
    }
  }, [languageOptions, selectedLanguage]);

  const isActionPending = useCallback(
    (actionId) => pendingAction === actionId,
    [pendingAction],
  );

  const handleToggleHistory = useCallback(
    (enabled) => {
      setHistoryCaptureEnabled(enabled);
    },
    [setHistoryCaptureEnabled],
  );

  const handleRetentionSelect = useCallback(
    async (policyId) => {
      setRetentionPolicy(policyId);
      const policy = getRetentionPolicyById(policyId);
      if (!policy || policy.days == null) {
        return;
      }
      setPendingAction("retention");
      try {
        await applyRetentionPolicy(policy.days, user);
      } finally {
        setPendingAction("");
      }
    },
    [setRetentionPolicy, applyRetentionPolicy, user],
  );

  const handleClearAll = useCallback(async () => {
    setPendingAction("clear-all");
    try {
      await clearHistory(user);
    } finally {
      setPendingAction("");
    }
  }, [clearHistory, user]);

  const handleClearLanguage = useCallback(async () => {
    if (!selectedLanguage) {
      return;
    }
    setPendingAction("clear-language");
    try {
      await clearHistoryByLanguage(selectedLanguage, user);
    } finally {
      setPendingAction("");
    }
  }, [clearHistoryByLanguage, selectedLanguage, user]);

  const handleExport = useCallback(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    try {
      const snapshot = {
        generatedAt: new Date().toISOString(),
        retentionPolicy: selectedPolicy
          ? { id: selectedPolicy.id, days: selectedPolicy.days }
          : { id: retentionPolicyId, days: null },
        historyCaptureEnabled,
        history,
      };
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      anchor.href = url;
      anchor.download = `${exportFileName}-${timestamp}.json`;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      console.error("[DataSection] export failed", error);
    }
  }, [
    history,
    historyCaptureEnabled,
    retentionPolicyId,
    selectedPolicy,
    exportFileName,
  ]);

  const canClearAll = history.length > 0;
  const canClearLanguage = selectedLanguage && languageOptions.length > 0;

  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={sectionDescription ? sectionDescriptionId : undefined}
      className={styles.section}
    >
      <div className={styles["section-header"]}>
        <h3 id={headingId} className={styles["section-title"]} tabIndex={-1}>
          {title}
        </h3>
        {sectionDescription ? (
          <p
            id={sectionDescriptionId}
            className={styles["section-description"]}
          >
            {sectionDescription}
          </p>
        ) : null}
        <div className={styles["section-divider"]} aria-hidden="true" />
      </div>
      <div className={styles.controls}>
        <fieldset
          className={styles["control-field"]}
          aria-labelledby={toggleFieldId}
        >
          <legend id={toggleFieldId} className={styles["control-label"]}>
            {toggleLabel}
          </legend>
          <p className={styles.description}>{toggleDescription}</p>
          <div
            role="radiogroup"
            aria-labelledby={toggleFieldId}
            className={styles.segments}
          >
            <button
              type="button"
              role="radio"
              aria-checked={historyCaptureEnabled}
              className={composeClassName(
                styles.segment,
                historyCaptureEnabled ? styles["segment-active"] : "",
              )}
              onClick={() => handleToggleHistory(true)}
            >
              {toggleOnLabel}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!historyCaptureEnabled}
              className={composeClassName(
                styles.segment,
                !historyCaptureEnabled ? styles["segment-active"] : "",
              )}
              onClick={() => handleToggleHistory(false)}
            >
              {toggleOffLabel}
            </button>
          </div>
        </fieldset>
        <fieldset
          className={styles["control-field"]}
          aria-labelledby={retentionFieldId}
        >
          <legend id={retentionFieldId} className={styles["control-label"]}>
            {retentionLabel}
          </legend>
          <p className={styles.description}>{retentionDescription}</p>
          <div
            role="radiogroup"
            aria-labelledby={retentionFieldId}
            className={styles.segments}
          >
            {retentionOptions.map((option) => {
              const active = retentionPolicyId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={composeClassName(
                    styles.segment,
                    active ? styles["segment-active"] : "",
                  )}
                  onClick={() => handleRetentionSelect(option.id)}
                  disabled={isActionPending("retention")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className={styles["control-field"]}>
          <label htmlFor={languageFieldId} className={styles["control-label"]}>
            {languageLabel}
          </label>
          {languageOptions.length > 0 ? (
            <div className={styles["language-shell"]}>
              <LanguageMenu
                id={languageFieldId}
                options={languageOptions}
                value={selectedLanguage}
                onChange={(value) =>
                  setSelectedLanguage(String(value ?? "").toUpperCase())
                }
                ariaLabel={languageLabel}
                normalizeValue={(value) =>
                  value == null ? "" : String(value).toUpperCase()
                }
                showLabel
                fullWidth
              />
            </div>
          ) : (
            <p className={styles.description}>{languagePlaceholder}</p>
          )}
          <div className={styles["subscription-current-actions"]}>
            <button
              type="button"
              className={styles["subscription-action"]}
              onClick={handleClearLanguage}
              disabled={!canClearLanguage || isActionPending("clear-language")}
            >
              {clearLanguageLabel}
            </button>
          </div>
        </div>
        <div className={styles["control-field"]}>
          <span className={styles["control-label"]}>{actionsLabel}</span>
          <p className={styles.description}>{exportDescription}</p>
          <div className={styles["subscription-current-actions"]}>
            <button
              type="button"
              className={styles["subscription-action"]}
              onClick={handleClearAll}
              disabled={!canClearAll || isActionPending("clear-all")}
            >
              {clearAllLabel}
            </button>
            <button
              type="button"
              className={styles["subscription-action"]}
              onClick={handleExport}
            >
              {exportLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

DataSection.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
};

DataSection.defaultProps = {
  message: "",
  descriptionId: undefined,
};

export default DataSection;
