import { useId } from "react";
import { useDataSectionCopy } from "./useDataSectionCopy.js";
import { useDataSectionLanguageSelection } from "./useDataSectionLanguageSelection.js";
import { usePendingAction } from "./usePendingAction.js";
import { useDataSectionControls } from "./useDataSectionControls.js";
import { useDataSectionState } from "./useDataSectionState.js";

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

/**
 * 意图：聚合 DataSection 所需的配置与动作，为视图层提供解耦接口。
 * 输入：
 *  - message: 分区辅助描述；
 *  - descriptionId: 辅助描述 aria id；
 * 输出：视图渲染所需的 copy、状态、命令、挂载 id 等。
 */
const useDataSectionMetadata = (message, descriptionId) => ({
  description: useSectionDescription(message, descriptionId),
  ids: useSectionIdentifiers(),
});

export const useDataSectionController = ({ message, descriptionId }) => {
  const { description, ids } = useDataSectionMetadata(message, descriptionId);
  const { copy, translations } = useDataSectionCopy();
  const { user, governance, historyState } = useDataSectionState();
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
