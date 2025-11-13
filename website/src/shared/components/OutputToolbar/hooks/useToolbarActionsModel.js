import { useMemo } from "react";
import { buildBlueprintItems } from "./actionBlueprints.js";
import { buildActionContext, createCopyItem } from "./actionFactories.js";

const selectActionContextInput = (input) => ({
  translator: input.translator,
  user: input.user,
  canDelete: input.canDelete,
  onDelete: input.onDelete,
  canReport: input.canReport,
  onReport: input.onReport,
  disabled: input.disabled,
});

const useActionContextMemo = (actionContextInput) =>
  useMemo(
    () => buildActionContext(actionContextInput),
    [
      actionContextInput.translator,
      actionContextInput.user,
      actionContextInput.canDelete,
      actionContextInput.onDelete,
      actionContextInput.canReport,
      actionContextInput.onReport,
      actionContextInput.disabled,
    ],
  );

const selectBlueprintItemsInput = ({ actionContext, disabled, user }) => ({
  actionContext,
  disabled,
  user,
});

const useBlueprintItemsMemo = (blueprintItemsInput) =>
  useMemo(
    () => buildBlueprintItems(blueprintItemsInput),
    [
      blueprintItemsInput.actionContext,
      blueprintItemsInput.disabled,
      blueprintItemsInput.user,
    ],
  );

const selectCopyItemInput = (input) => ({
  translator: input.translator,
  copyFeedbackState: input.copyFeedbackState,
  isCopySuccess: input.isCopySuccess,
  disabled: input.disabled,
  canCopy: input.canCopy,
  onCopy: input.onCopy,
});

const useCopyItemMemo = (copyItemInput) =>
  useMemo(
    () => createCopyItem(copyItemInput),
    [
      copyItemInput.translator,
      copyItemInput.copyFeedbackState,
      copyItemInput.isCopySuccess,
      copyItemInput.disabled,
      copyItemInput.canCopy,
      copyItemInput.onCopy,
    ],
  );

const useActionItemsMemo = ({ copyItem, blueprintItems }) =>
  useMemo(() => [copyItem, ...blueprintItems], [copyItem, blueprintItems]);

export function useToolbarActionsModel(input) {
  const actionContext = useActionContextMemo(selectActionContextInput(input));
  const blueprintItems = useBlueprintItemsMemo(
    selectBlueprintItemsInput({
      actionContext,
      disabled: input.disabled,
      user: input.user,
    }),
  );
  const copyItem = useCopyItemMemo(selectCopyItemInput(input));
  const items = useActionItemsMemo({ copyItem, blueprintItems });

  return { items };
}
