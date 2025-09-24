import { useEffect } from "react";
import styles from "./Toast.module.css";

/**
 * Minimal toast message. Auto hides after duration.
 */
function Toast({ open, message, duration = 3000, onClose }) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;
  return <div className={styles.toast}>{message}</div>;
}

export default Toast;
