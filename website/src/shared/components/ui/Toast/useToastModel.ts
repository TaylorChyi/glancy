import { useCallback, useEffect, useMemo } from "react";

const DEFAULT_DURATION = 3000;
const DEFAULT_CLOSE_LABEL = "Dismiss notification";

const isValidDuration = (duration: unknown): duration is number =>
  typeof duration === "number" && duration > 0 && Number.isFinite(duration);

export const buildToastStyle = ({
  backgroundColor,
  textColor,
}: {
  backgroundColor?: string;
  textColor?: string;
}) => {
  const style: Record<string, string> = {};
  if (backgroundColor) {
    style["--toast-bg"] = backgroundColor;
  }
  if (textColor) {
    style["--toast-color"] = textColor;
  }
  return style;
};

export const useAutoDismiss = ({
  open = false,
  duration = DEFAULT_DURATION,
  onClose,
}: {
  open?: boolean;
  duration?: number;
  onClose?: () => void;
}) => {
  const handleClose = useCallback(() => {
    if (typeof onClose === "function") {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!open || !isValidDuration(duration) || typeof onClose !== "function") {
      return undefined;
    }

    const timer = window.setTimeout(handleClose, duration);
    return () => window.clearTimeout(timer);
  }, [open, duration, onClose, handleClose]);

  return handleClose;
};

export const useToastModel = ({
  open = false,
  message = "",
  duration = DEFAULT_DURATION,
  onClose,
  backgroundColor,
  textColor,
  closeLabel = DEFAULT_CLOSE_LABEL,
}) => {
  const handleClose = useAutoDismiss({ open, duration, onClose });
  const inlineStyle = useMemo(
    () => buildToastStyle({ backgroundColor, textColor }),
    [backgroundColor, textColor],
  );

  return {
    viewProps: { open, message, closeLabel, handleClose, inlineStyle },
  };
};

export default useToastModel;
