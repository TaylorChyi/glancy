import PropTypes from "prop-types";
import styles from "../AvatarEditorModal.module.css";

function EditorActionButtons({
  onCancel,
  onConfirm,
  isProcessing,
  cancelLabel,
  confirmLabel,
}) {
  return (
    <div className={styles["action-buttons"]}>
      <button
        type="button"
        className={`${styles["action-button"]} ${styles["cancel-button"]}`}
        onClick={onCancel}
        disabled={isProcessing}
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        className={`${styles["action-button"]} ${styles["confirm-button"]}`}
        onClick={onConfirm}
        disabled={isProcessing}
      >
        {isProcessing ? `${confirmLabel}…` : confirmLabel}
      </button>
    </div>
  );
}

EditorActionButtons.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool.isRequired,
  cancelLabel: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string.isRequired,
};

export default EditorActionButtons;
