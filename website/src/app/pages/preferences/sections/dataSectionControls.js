import { useCallback } from "react";
import {
  ACTION_CLEAR_ALL,
  ACTION_CLEAR_LANGUAGE,
  ACTION_RETENTION,
  useClearAllHandler,
  useClearLanguageHandler,
  useExportHandler,
  useHistoryToggleOptions,
  useRetentionHandler,
  useRetentionOptions,
} from "./dataSectionActions.js";

export const useHistoryToggleControl = ({
  copy,
  historyCaptureEnabled,
  setHistoryCaptureEnabled,
}) => {
  const options = useHistoryToggleOptions(copy.toggle);
  const handleToggleHistory = useCallback(
    (enabled) => setHistoryCaptureEnabled(enabled),
    [setHistoryCaptureEnabled],
  );
  return {
    value: historyCaptureEnabled,
    options,
    onChange: handleToggleHistory,
  };
};

export const useRetentionControl = ({
  retentionPolicyId,
  setRetentionPolicy,
  applyRetentionPolicy,
  runWithPending,
  user,
  translations,
}) => {
  const options = useRetentionOptions(translations);
  const handleRetentionSelect = useRetentionHandler({
    setRetentionPolicy,
    applyRetentionPolicy,
    runWithPending,
    user,
  });
  return {
    value: retentionPolicyId,
    options,
    onChange: handleRetentionSelect,
    pendingId: ACTION_RETENTION,
  };
};

export const useLanguageControl = ({
  copy,
  languageSelection,
  clearHistoryByLanguage,
  runWithPending,
  user,
}) => {
  const handleClearLanguage = useClearLanguageHandler({
    clearHistoryByLanguage,
    language: languageSelection.selectedLanguage,
    runWithPending,
    user,
  });
  return {
    copy: {
      ...copy.language,
      clearLabel: copy.actions.clearLanguageLabel,
    },
    value: languageSelection.selectedLanguage,
    options: languageSelection.options,
    onChange: languageSelection.selectLanguage,
    onClear: handleClearLanguage,
    canClear: languageSelection.canClear,
    pendingId: ACTION_CLEAR_LANGUAGE,
  };
};

export const useActionsControl = ({
  copy,
  history,
  clearHistory,
  runWithPending,
  user,
  translations,
}) => {
  const handleClearAll = useClearAllHandler({
    clearHistory,
    runWithPending,
    user,
  });
  const handleExport = useExportHandler({
    history,
    translations,
    fileName: copy.actions.fileName,
  });
  return {
    copy: {
      label: copy.actions.label,
      description: copy.actions.exportDescription,
      clearAllLabel: copy.actions.clearAllLabel,
      exportLabel: copy.actions.exportLabel,
    },
    onClearAll: handleClearAll,
    onExport: handleExport,
    canClearAll: history.length > 0,
    pendingId: ACTION_CLEAR_ALL,
  };
};
