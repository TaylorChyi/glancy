import styles from "./MessagePopup.module.css";
import { useLanguage } from "@/context";
import { useEscapeKey } from "@/hooks";
import { withStopPropagation } from "@/utils/stopPropagation.js";

/**
 * Generic popup for transient messages.
 * Accepts optional children for action buttons.
 */
function MessagePopup({ open, message, onClose, children }) {
  const { t } = useLanguage();
  const closeLabel = t.close;
  useEscapeKey(onClose, open);

  if (!open) return null;
  return (
    <div className={styles["popup-overlay"]} onClick={onClose}>
      <div
        className={styles.popup}
        onClick={withStopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className={styles.message}>{message}</div>
        {children && <div className={styles.actions}>{children}</div>}
        <button
          type="button"
          onClick={onClose}
          className={styles["close-btn"]}
          aria-label={closeLabel}
        >
          <span className={styles["close-btn-icon"]} aria-hidden="true" />
          <span className={styles["close-btn-label"]}>{closeLabel}</span>
        </button>
      </div>
    </div>
  );
}

export default MessagePopup;
