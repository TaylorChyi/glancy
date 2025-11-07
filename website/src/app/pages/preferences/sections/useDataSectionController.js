import { useId } from "react";
import { useUser } from "@core/context";
import { useDataGovernanceStore } from "@core/store/dataGovernanceStore.ts";
import { useHistoryStore } from "@core/store/historyStore.ts";
import { useDataSectionCopy } from "./useDataSectionCopy.js";
import { useDataSectionLanguageSelection } from "./useDataSectionLanguageSelection.js";
import { usePendingAction } from "./usePendingAction.js";
import {
  useActionsControl,
  useHistoryToggleControl,
  useLanguageControl,
  useRetentionControl,
} from "./dataSectionControls.js";

const useSectionDescription = (message, descriptionId) => {
  const hasMessage = typeof message === "string" && message.trim().length > 0;
  return {
    section: hasMessage ? message : undefined,
    id: hasMessage ? descriptionId : undefined,
  };
};

const useSectionIdentifiers = () => ({
  toggle: useId(),
  retention: useId(),
  language: useId(),
});

const useGovernanceSlice = () =>
  useDataGovernanceStore((state) => ({
    historyCaptureEnabled: state.historyCaptureEnabled,
    retentionPolicyId: state.retentionPolicyId,
    setHistoryCaptureEnabled: state.setHistoryCaptureEnabled,
    setRetentionPolicy: state.setRetentionPolicy,
  }));

const useHistorySlice = () =>
  useHistoryStore((state) => ({
    history: state.history,
    clearHistory: state.clearHistory,
    clearHistoryByLanguage: state.clearHistoryByLanguage,
    applyRetentionPolicy: state.applyRetentionPolicy,
  }));

const useDataSectionControls = ({
  copy,
  translations,
  governance,
  historyState,
  languageSelection,
  runWithPending,
  user,
}) => {
  const {
    historyCaptureEnabled,
    retentionPolicyId,
    setHistoryCaptureEnabled,
    setRetentionPolicy,
  } = governance;
  const {
    history,
    clearHistory,
    clearHistoryByLanguage,
    applyRetentionPolicy,
  } = historyState;

  const historyToggle = useHistoryToggleControl({
    copy,
    historyCaptureEnabled,
    setHistoryCaptureEnabled,
  });
  const retentionControl = useRetentionControl({
    retentionPolicyId,
    setRetentionPolicy,
    applyRetentionPolicy,
    runWithPending,
    user,
    translations,
  });
  const languageControl = useLanguageControl({
    copy,
    languageSelection,
    clearHistoryByLanguage,
    runWithPending,
    user,
  });
  const actionsControl = useActionsControl({
    copy,
    history,
    clearHistory,
    runWithPending,
    user,
    translations,
  });

  return { historyToggle, retentionControl, languageControl, actionsControl };
};

/**
 * 意图：聚合 DataSection 所需的配置与动作，为视图层提供解耦接口。
 * 输入：
 *  - message: 分区辅助描述；
 *  - descriptionId: 辅助描述 aria id；
 * 输出：视图渲染所需的 copy、状态、命令、挂载 id 等。
 */
export const useDataSectionController = ({ message, descriptionId }) => {
  const description = useSectionDescription(message, descriptionId);
  const ids = useSectionIdentifiers();
  const { copy, translations } = useDataSectionCopy();
  const user = useUser()?.user ?? null;
  const governance = useGovernanceSlice();
  const historyState = useHistorySlice();
  const languageSelection = useDataSectionLanguageSelection(
    historyState.history,
    translations,
  );
  const { runWithPending, isActionPending } = usePendingAction();

  const controls = useDataSectionControls({
    copy,
    translations,
    governance,
    historyState,
    languageSelection,
    runWithPending,
    user,
  });

  return {
    copy,
    ids,
    description,
    ...controls,
    isActionPending,
  };
};
