/**
 * 背景：
 *  - 偏好设置中的数据分区长期以占位呈现，无法承接历史留存、清理与导出等治理诉求。
 * 目的：
 *  - 通过组合 + 命令策略模式，将历史采集开关、保留窗口、按语言清理与导出等动作集中在一个可复用的面板中；
 *    Store 负责状态持久化，组件负责编排命令执行，保证后续接入后端 API 时仅需替换命令实现。
 * 关键决策与取舍：
 *  - 采用 Segmented + 行为按钮的组合布局，复用既有样式令牌确保视觉一致；
 *  - 动作执行通过局部 pending 状态串联，避免全局 Loading 阻塞其他设置操作；
 *  - 导出功能以内联 CSV 导出实现，待服务端导出接口上线后可替换命令实现而无需改动 UI。
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
// 避免经由 store/index 桶状导出的路径，确保页面依赖在打包拆分时保持拓扑稳定
// 并为后续按需加载各 store 留出空间。
import { useDataGovernanceStore } from "@/store/dataGovernanceStore.ts";
import { useHistoryStore } from "@/store/historyStore.ts";
import {
  DATA_RETENTION_POLICIES,
  getRetentionPolicyById,
} from "@/store/dataGovernanceStore";
import styles from "../Preferences.module.css";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

const formatHistoryVersionsForCsv = (versions = []) => {
  if (!Array.isArray(versions) || versions.length === 0) {
    return "";
  }
  return versions
    .map((version) => {
      const id = version?.id ?? "";
      const timestamp = version?.createdAt ?? "";
      const favoriteLabel = version?.favorite ? "favorite" : "regular";
      return `${id} [${timestamp}] {${favoriteLabel}}`;
    })
    .join(" | ");
};

const normalizeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const toCsvRow = (values) => values.map(normalizeCsvValue).join(",");

/**
 * 意图：
 *  - 将数据治理快照序列化为 CSV 字符串，确保下载命令仍与 UI 解耦且易于替换为后端导出实现。
 * 输入：
 *  - generatedAt: 导出时间戳；
 *  - historyCaptureEnabled: 历史采集开关状态；
 *  - retentionPolicy: 当前保留策略的标识与时长；
 *  - history: 本地历史记录集合。
 * 输出：
 *  - 符合 RFC4180 的 CSV 文本，前两行用于元信息，其余为历史记录行。
 * 流程：
 *  1) 构建元信息头部与数据行；
 *  2) 插入空行以分隔元信息与明细；
 *  3) 逐条映射历史记录并格式化版本摘要。
 * 错误处理：
 *  - 输入缺失时回退到安全的空值，避免阻塞导出流程。
 * 复杂度：
 *  - 时间 O(n)，取决于历史记录条目数；空间 O(n) 用于缓冲输出行。
 */
const serializeSnapshotToCsv = ({
  generatedAt,
  historyCaptureEnabled,
  retentionPolicy,
  history,
}) => {
  const normalizedPolicy = {
    id: retentionPolicy?.id ? String(retentionPolicy.id) : "",
    days:
      retentionPolicy?.days === 0 || retentionPolicy?.days
        ? String(retentionPolicy.days)
        : "",
  };
  const metaHeader = [
    "generatedAt",
    "historyCaptureEnabled",
    "retentionPolicyId",
    "retentionDays",
  ];
  const metaRow = [
    generatedAt,
    historyCaptureEnabled ? "true" : "false",
    normalizedPolicy.id,
    normalizedPolicy.days,
  ];
  const historyHeader = [
    "term",
    "language",
    "flavor",
    "createdAt",
    "favorite",
    "versions",
  ];
  const historyRows = Array.isArray(history)
    ? history.map((item) => [
        item?.term ?? "",
        item?.language ?? "",
        item?.flavor ?? "",
        item?.createdAt ?? "",
        item?.favorite ? "true" : "false",
        formatHistoryVersionsForCsv(item?.versions ?? []),
      ])
    : [];
  const rows = [metaHeader, metaRow, [], historyHeader, ...historyRows];
  return rows.map((row) => toCsvRow(row)).join("\r\n");
};

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

  const fallbackSectionDescriptionId = useId();
  const hasSectionMessage =
    typeof message === "string" && message.trim().length > 0;
  const sectionDescriptionId = hasSectionMessage
    ? descriptionId ?? fallbackSectionDescriptionId
    : undefined;

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
  const languageDescription =
    t.settingsDataLanguageDescription ||
    "Only clears saved lookups for the selected language.";
  const languagePlaceholder =
    t.settingsDataClearLanguagePlaceholder || "No language history yet";

  const actionsLabel = t.settingsDataActionsLabel || "Data actions";
  const clearAllLabel = t.settingsDataClearAll || "Erase all history";
  const clearLanguageLabel =
    t.settingsDataClearLanguage || "Clear selected language";
  const exportLabel = t.settingsDataExport || "Export data";
  const exportDescription =
    t.settingsDataExportDescription ||
    "Download a CSV snapshot of your preferences and history.";
  const exportFileName = t.settingsDataExportFileName || "glancy-data-export";

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
      const generatedAt = new Date().toISOString();
      const retentionSnapshot = selectedPolicy
        ? { id: selectedPolicy.id, days: selectedPolicy.days }
        : { id: retentionPolicyId, days: null };
      const csv = serializeSnapshotToCsv({
        generatedAt,
        historyCaptureEnabled,
        retentionPolicy: retentionSnapshot,
        history,
      });
      const blob = new Blob([`\ufeff${csv}`], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      anchor.href = url;
      anchor.download = `${exportFileName}-${timestamp}.csv`;
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
      aria-describedby={sectionDescriptionId}
      className={composeClassName(styles.section, styles["section-plain"])}
    >
      <div className={styles["section-header"]}>
        <h3 id={headingId} className={styles["section-title"]} tabIndex={-1}>
          {title}
        </h3>
        <div className={styles["section-divider"]} aria-hidden="true" />
      </div>
      {hasSectionMessage ? (
        // 使用视觉隐藏的描述串联 message，确保屏幕阅读器获得上下文而不干扰视觉布局。
        <p
          id={sectionDescriptionId}
          className={styles["visually-hidden"]}
        >
          {message}
        </p>
      ) : null}
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
          <p className={styles.description}>{languageDescription}</p>
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
              className={composeClassName(
                styles["subscription-action"],
                styles["subscription-action-danger"],
              )}
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
