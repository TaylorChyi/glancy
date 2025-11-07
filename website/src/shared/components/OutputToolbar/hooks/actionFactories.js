import { resolveCopyIcon } from "./iconFactories";

export const buildActionContext = ({
  translator,
  user,
  canDelete,
  onDelete,
  canReport,
  onReport,
  disabled,
}) => ({
  translator,
  user,
  canDelete,
  onDelete,
  canReport,
  onReport,
  disabled,
});

export const createCopyItem = ({
  translator,
  copyFeedbackState,
  isCopySuccess,
  disabled,
  canCopy,
  onCopy,
}) => {
  const success = Boolean(isCopySuccess || copyFeedbackState === "success");
  const baseLabel = translator.copyAction || "Copy";
  const label = success ? translator.copySuccess || baseLabel : baseLabel;
  const icon = resolveCopyIcon(success);
  const copyDisabled =
    disabled || success || !canCopy || typeof onCopy !== "function";
  return {
    key: "copy",
    label,
    icon,
    onClick: onCopy,
    active: false,
    variant: "copy",
    disabled: copyDisabled,
  };
};
