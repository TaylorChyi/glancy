import { useMemo } from "react";

const selectToolbarActionsDeps = (input) => ({
  translator: input.translator,
  user: input.user,
  disabled: input.disabled,
  canCopy: input.canCopy,
  onCopy: input.onCopy,
  copyFeedbackState: input.copyFeedbackState,
  isCopySuccess: input.isCopySuccess,
  canDelete: input.canDelete,
  onDelete: input.onDelete,
  canReport: input.canReport,
  onReport: input.onReport,
});

const buildToolbarActionsProps = (deps) => ({
  translator: deps.translator,
  user: deps.user,
  disabled: Boolean(deps.disabled),
  canCopy: deps.canCopy,
  onCopy: deps.onCopy,
  copyFeedbackState: deps.copyFeedbackState,
  isCopySuccess: deps.isCopySuccess,
  canDelete: deps.canDelete,
  onDelete: deps.onDelete,
  canReport: deps.canReport,
  onReport: deps.onReport,
});

function useToolbarActionsPropsMemo(deps) {
  const {
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
  } = deps;

  return useMemo(
    () =>
      buildToolbarActionsProps({
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
      }),
    [
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
    ],
  );
}

export const useToolbarActionsProps = (input) =>
  useToolbarActionsPropsMemo(selectToolbarActionsDeps(input));
