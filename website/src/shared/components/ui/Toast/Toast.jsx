import { useCallback, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import styles from "./Toast.module.css";


const DEFAULT_DURATION = 3000;
const DEFAULT_CLOSE_LABEL = "Dismiss notification";

function Toast({
  open,
  message,
  duration = DEFAULT_DURATION,
  onClose,
  backgroundColor,
  textColor,
  closeLabel = DEFAULT_CLOSE_LABEL,
}) {
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
    const style = {};
    if (backgroundColor) {
      style["--toast-bg"] = backgroundColor;
    }
    if (textColor) {
      style["--toast-color"] = textColor;
    }
    return style;
  }, [backgroundColor, textColor]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={styles.toast}
      role="status"
      aria-live="polite"
      style={inlineStyle}
    >
      <button
        type="button"
        className={styles["dismiss-button"]}
        aria-label={closeLabel}
        onClick={handleClose}
      >
        <span aria-hidden="true">×</span>
      </button>
      <p className={styles.message}>{message}</p>
    </div>
  );
}

Toast.propTypes = {
  open: PropTypes.bool,
  message: PropTypes.string,
  duration: PropTypes.number,
  onClose: PropTypes.func,
  backgroundColor: PropTypes.string,
  textColor: PropTypes.string,
  closeLabel: PropTypes.string,
};

Toast.defaultProps = {
  open: false,
  message: "",
  duration: DEFAULT_DURATION,
  onClose: undefined,
  backgroundColor: undefined,
  textColor: undefined,
  closeLabel: DEFAULT_CLOSE_LABEL,
};

export default Toast;
