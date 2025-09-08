import Button from "@/components/ui/Button";
import styles from "./MessagePopup.module.css";
import { useEscapeKey } from "@/hooks";
import { withStopPropagation } from "@/utils/stopPropagation.js";

/**
 * Generic popup for transient messages.
 * Accepts optional children for action buttons.
 */
function MessagePopup({ open, message, onClose, children }) {
  useEscapeKey(onClose, open);

  if (!open) return null;
  return (
    <div className={styles["popup-overlay"]} onClick={onClose}>
      <div className={styles.popup} onClick={withStopPropagation()}>
        <div>{message}</div>
        {children && <div className={styles.actions}>{children}</div>}
        <Button type="button" onClick={onClose} className={styles["close-btn"]}>
          Close
        </Button>
      </div>
    </div>
  );
}

export default MessagePopup;
