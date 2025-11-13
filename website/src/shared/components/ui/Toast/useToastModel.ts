import { useCallback, useEffect, useMemo } from "react";

const DEFAULT_DURATION = 3000;
const DEFAULT_CLOSE_LABEL = "Dismiss notification";

export const useToastModel = ({
  open = false,
  message = "",
  duration = DEFAULT_DURATION,
  onClose,
  backgroundColor,
  textColor,
  closeLabel = DEFAULT_CLOSE_LABEL,
}) => {
  const handleClose = useCallback(() => {
    if (typeof onClose === "function") {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    if (typeof duration !== "number" || duration <= 0) {
      return undefined;
    }
    if (!Number.isFinite(duration)) {
      return undefined;
    }
    if (typeof onClose !== "function") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, duration, onClose]);

  const inlineStyle = useMemo(() => {
    const style: Record<string, string> = {};
    if (backgroundColor) {
      style["--toast-bg"] = backgroundColor;
    }
    if (textColor) {
      style["--toast-color"] = textColor;
    }
    return style;
  }, [backgroundColor, textColor]);

  return {
    viewProps: {
      open,
      message,
      closeLabel,
      handleClose,
      inlineStyle,
    },
  };
};

export default useToastModel;
