import {
  useActionsControl,
  useHistoryToggleControl,
  useLanguageControl,
  useRetentionControl,
} from "./dataSectionControls.js";

export const useHistoryToggle = ({ copy, governance }) =>
  useHistoryToggleControl({
    copy,
    historyCaptureEnabled: governance.historyCaptureEnabled,
    setHistoryCaptureEnabled: governance.setHistoryCaptureEnabled,
  });

export const useRetentionSelection = ({
  governance,
  historyState,
  runWithPending,
  user,
  translations,
}) =>
  useRetentionControl({
    retentionPolicyId: governance.retentionPolicyId,
    setRetentionPolicy: governance.setRetentionPolicy,
    applyRetentionPolicy: historyState.applyRetentionPolicy,
    runWithPending,
    user,
    translations,
  });

export const useLanguageActions = ({
  copy,
  languageSelection,
  historyState,
  runWithPending,
  user,
}) =>
  useLanguageControl({
    copy,
    languageSelection,
    clearHistoryByLanguage: historyState.clearHistoryByLanguage,
    runWithPending,
    user,
  });

export const useActionCommands = ({
  copy,
  historyState,
  runWithPending,
  user,
  translations,
}) =>
  useActionsControl({
    copy,
    history: historyState.history,
    clearHistory: historyState.clearHistory,
    runWithPending,
    user,
    translations,
  });

export const useDataSectionControls = (dependencies) => ({
  historyToggle: useHistoryToggle(dependencies),
  retentionControl: useRetentionSelection(dependencies),
  languageControl: useLanguageActions(dependencies),
  actionsControl: useActionCommands(dependencies),
});

export default useDataSectionControls;
