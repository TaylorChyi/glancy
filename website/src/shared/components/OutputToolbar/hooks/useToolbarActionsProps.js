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

export const useToolbarActionsProps = (input) => {
  const deps = selectToolbarActionsDeps(input);
  return useMemo(
    () => buildToolbarActionsProps(deps),
    [
      deps.translator,
      deps.user,
      deps.disabled,
      deps.canCopy,
      deps.onCopy,
      deps.copyFeedbackState,
      deps.isCopySuccess,
      deps.canDelete,
      deps.onDelete,
      deps.canReport,
      deps.onReport,
    ],
  );
};
