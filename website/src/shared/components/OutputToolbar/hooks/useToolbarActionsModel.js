import { useMemo } from "react";
import { buildBlueprintItems } from "./actionBlueprints.js";
import { buildActionContext, createCopyItem } from "./actionFactories.js";

const useActionContextMemo = ({
  translator,
  user,
  canDelete,
  onDelete,
  canReport,
  onReport,
  disabled,
}) =>
  useMemo(
    () =>
      buildActionContext({
        translator,
        user,
        canDelete,
        onDelete,
        canReport,
        onReport,
        disabled,
      }),
    [
      translator,
      user,
      canDelete,
      onDelete,
      canReport,
      onReport,
      disabled,
    ],
  );

const useBlueprintItemsMemo = ({ actionContext, disabled, user }) =>
  useMemo(
    () =>
      buildBlueprintItems({
        actionContext,
        disabled,
        user,
      }),
    [actionContext, disabled, user],
  );

const useCopyItemMemo = ({
  translator,
  copyFeedbackState,
  isCopySuccess,
  disabled,
  canCopy,
  onCopy,
}) =>
  useMemo(
    () =>
      createCopyItem({
        translator,
        copyFeedbackState,
        isCopySuccess,
        disabled,
        canCopy,
        onCopy,
      }),
    [translator, copyFeedbackState, isCopySuccess, disabled, canCopy, onCopy],
  );

const useActionItemsMemo = ({ copyItem, blueprintItems }) =>
  useMemo(() => [copyItem, ...blueprintItems], [copyItem, blueprintItems]);

export function useToolbarActionsModel({
  translator,
  user,
  disabled,
  canCopy,
  onCopy,
  copyFeedbackState,
  isCopySuccess,
  canDelete,
  onDelete,
  canReport,
  onReport,
}) {
  const actionContext = useActionContextMemo({
    translator,
    user,
    canDelete,
    onDelete,
    canReport,
    onReport,
    disabled,
  });
  const blueprintItems = useBlueprintItemsMemo({
    actionContext,
    disabled,
    user,
  });
  const copyItem = useCopyItemMemo({
    translator,
    copyFeedbackState,
    isCopySuccess,
    disabled,
    canCopy,
    onCopy,
  });
  const items = useActionItemsMemo({ copyItem, blueprintItems });

  return { items };
}
