/**
 * 背景：
 *  - DataSection 需要大量文案配置，若直接在控制器内拼装会影响可读性与可测试性。
 * 目的：
 *  - 将文案解析抽离为独立 Hook，便于在测试中单独校验默认值与翻译键。
 * 关键决策与取舍：
 *  - 复用 useLanguage 提供的多语言上下文，保持与现有 i18n 管道对齐；
 *  - 默认值遵循现有实现，确保在缺失翻译时仍有可用文案。
 * 影响范围：
 *  - 偏好设置数据分区的文案装配；
 *  - 其他模块可按需复用 buildCopy 逻辑。
 * 演进与TODO：
 *  - TODO: 若未来引入文案 A/B 实验，可在此 Hook 内接入实验分流逻辑。
 */

import { useMemo } from "react";
import { useLanguage } from "@core/context";

const withFallback = (value, fallback) => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return fallback;
};

const buildToggleCopy = (t) => ({
  label: withFallback(t.settingsDataHistoryToggleLabel, "History collection"),
  description: withFallback(
    t.settingsDataHistoryToggleDescription,
    "Decide whether Glancy keeps new lookups for quick recall.",
  ),
  onLabel: withFallback(t.settingsDataHistoryToggleOn, "Capture history"),
  offLabel: withFallback(t.settingsDataHistoryToggleOff, "Pause history"),
});

const buildRetentionCopy = (t) => ({
  label: withFallback(t.settingsDataRetentionLabel, "Retention window"),
  description: withFallback(
    t.settingsDataRetentionDescription,
    "Choose how long records stay before we prune them.",
  ),
});

const buildLanguageCopy = (t) => ({
  label: withFallback(t.settingsDataLanguageLabel, "Language history"),
  description: withFallback(
    t.settingsDataLanguageDescription,
    "Only clears saved lookups for the selected language.",
  ),
  placeholder: withFallback(
    t.settingsDataClearLanguagePlaceholder,
    "No language history yet",
  ),
});

const buildActionsCopy = (t) => ({
  label: withFallback(t.settingsDataActionsLabel, "Data actions"),
  clearAllLabel: withFallback(t.settingsDataClearAll, "Erase all history"),
  clearLanguageLabel: withFallback(
    t.settingsDataClearLanguage,
    "Clear selected language",
  ),
  exportLabel: withFallback(t.settingsDataExport, "Export data"),
  exportDescription: withFallback(
    t.settingsDataExportDescription,
    "Download a CSV snapshot of your preferences and history.",
  ),
  fileName: withFallback(t.settingsDataExportFileName, "glancy-data-export"),
});

const buildCopy = (translations) => ({
  toggle: buildToggleCopy(translations),
  retention: buildRetentionCopy(translations),
  language: buildLanguageCopy(translations),
  actions: buildActionsCopy(translations),
});

export const useDataSectionCopy = () => {
  const { t } = useLanguage();
  const copy = useMemo(() => buildCopy(t), [t]);
  return { copy, translations: t };
};
