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

const createHistoryControlConfig = ({ value, options, onChange }) => ({
  value,
  options,
  onChange,
});

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
  return createHistoryControlConfig({
    value: historyCaptureEnabled,
    options,
    onChange: handleToggleHistory,
  });
};

const createRetentionControlConfig = ({ value, options, onChange }) => ({
  value,
  options,
  onChange,
  pendingId: ACTION_RETENTION,
});

export const useRetentionControl = ({
  retentionPolicyId,
  setRetentionPolicy,
  applyRetentionPolicy,
  runWithPending,
  user,
  translations,
}) => {
  const options = useRetentionOptions(translations);
  const onChange = useRetentionHandler({
    setRetentionPolicy,
    applyRetentionPolicy,
    runWithPending,
    user,
  });
  return createRetentionControlConfig({
    value: retentionPolicyId,
    options,
    onChange,
  });
};

const buildLanguageCopy = (copy) => ({
  ...copy.language,
  clearLabel: copy.actions.clearLanguageLabel,
});

const createLanguageControlConfig = ({
  copy,
  selection,
  onClear,
}) => ({
  copy,
  value: selection.selectedLanguage,
  options: selection.options,
  onChange: selection.selectLanguage,
  onClear,
  canClear: selection.canClear,
  pendingId: ACTION_CLEAR_LANGUAGE,
});

export const useLanguageControl = ({
  copy,
  languageSelection,
  clearHistoryByLanguage,
  runWithPending,
  user,
}) => {
  const onClear = useClearLanguageHandler({
    clearHistoryByLanguage,
    language: languageSelection.selectedLanguage,
    runWithPending,
    user,
  });
  return createLanguageControlConfig({
    copy: buildLanguageCopy(copy),
    selection: languageSelection,
    onClear,
  });
};

const buildActionsCopy = (copy) => ({
  label: copy.actions.label,
  description: copy.actions.exportDescription,
  clearAllLabel: copy.actions.clearAllLabel,
  exportLabel: copy.actions.exportLabel,
});

const createActionsControlConfig = ({
  copy,
  onClearAll,
  onExport,
  history,
}) => ({
  copy,
  onClearAll,
  onExport,
  canClearAll: history.length > 0,
  pendingId: ACTION_CLEAR_ALL,
});

export const useActionsControl = ({
  copy,
  history,
  clearHistory,
  runWithPending,
  user,
  translations,
}) => {
  const onClearAll = useClearAllHandler({
    clearHistory,
    runWithPending,
    user,
  });
  const onExport = useExportHandler({
    history,
    translations,
    fileName: copy.actions.fileName,
  });
  return createActionsControlConfig({
    copy: buildActionsCopy(copy),
    onClearAll,
    onExport,
    history,
  });
};
