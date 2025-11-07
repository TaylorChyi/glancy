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
