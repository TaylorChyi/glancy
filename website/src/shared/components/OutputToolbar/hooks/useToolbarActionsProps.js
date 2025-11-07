import { useMemo } from "react";

export const useToolbarActionsProps = ({
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
}) =>
  useMemo(
    () => ({
      translator,
      user,
      disabled: Boolean(disabled),
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
