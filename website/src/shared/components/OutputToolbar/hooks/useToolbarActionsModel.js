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
    [actionContextInput],
  );

const selectBlueprintItemsInput = ({ actionContext, disabled, user }) => ({
  actionContext,
  disabled,
  user,
});

const useActionContextInputMemo = (input) => {
  const {
    translator,
    user,
    canDelete,
    onDelete,
    canReport,
    onReport,
    disabled,
  } = input;

  return useMemo(
    () =>
      selectActionContextInput({
        translator,
        user,
        canDelete,
        onDelete,
        canReport,
        onReport,
        disabled,
      }),
    [translator, user, canDelete, onDelete, canReport, onReport, disabled],
  );
};

const useBlueprintItemsMemo = (blueprintItemsInput) =>
  useMemo(
    () => buildBlueprintItems(blueprintItemsInput),
    [blueprintItemsInput],
  );

const useBlueprintItemsInputMemo = ({ actionContext, disabled, user }) =>
  useMemo(
    () =>
      selectBlueprintItemsInput({
        actionContext,
        disabled,
        user,
      }),
    [actionContext, disabled, user],
  );

const selectCopyItemInput = (input) => ({
  translator: input.translator,
  copyFeedbackState: input.copyFeedbackState,
  isCopySuccess: input.isCopySuccess,
  disabled: input.disabled,
  canCopy: input.canCopy,
  onCopy: input.onCopy,
});

const useCopyItemInputMemo = (input) => {
  const {
    translator,
    copyFeedbackState,
    isCopySuccess,
    disabled,
    canCopy,
    onCopy,
  } = input;

  return useMemo(
    () =>
      selectCopyItemInput({
        translator,
        copyFeedbackState,
        isCopySuccess,
        disabled,
        canCopy,
        onCopy,
      }),
    [
      translator,
      copyFeedbackState,
      isCopySuccess,
      disabled,
      canCopy,
      onCopy,
    ],
  );
};

const useCopyItemMemo = (copyItemInput) =>
  useMemo(
    () => createCopyItem(copyItemInput),
    [copyItemInput],
  );

const useActionItemsMemo = ({ copyItem, blueprintItems }) =>
  useMemo(() => [copyItem, ...blueprintItems], [copyItem, blueprintItems]);

export function useToolbarActionsModel(input) {
  const actionContextInput = useActionContextInputMemo(input);
  const actionContext = useActionContextMemo(actionContextInput);

  const blueprintItemsInput = useBlueprintItemsInputMemo({
    actionContext,
    disabled: input.disabled,
    user: input.user,
  });
  const blueprintItems = useBlueprintItemsMemo(blueprintItemsInput);

  const copyItemInput = useCopyItemInputMemo(input);
  const copyItem = useCopyItemMemo(copyItemInput);
  const items = useActionItemsMemo({ copyItem, blueprintItems });

  return { items };
}
