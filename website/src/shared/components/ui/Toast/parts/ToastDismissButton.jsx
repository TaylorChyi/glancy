import PropTypes from "prop-types";
import styles from "../Toast.module.css";

function ToastDismissButton({ label, onClose }) {
  return (
    <button
      type="button"
      className={styles["dismiss-button"]}
      aria-label={label}
      onClick={onClose}
    >
      <span aria-hidden="true">×</span>
    </button>
  );
}

ToastDismissButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ToastDismissButton;
