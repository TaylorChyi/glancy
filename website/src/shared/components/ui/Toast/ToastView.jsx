import PropTypes from "prop-types";
import styles from "./Toast.module.css";
import ToastDismissButton from "./parts/ToastDismissButton.jsx";

function ToastView({ open, message, closeLabel, handleClose, inlineStyle }) {
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
      <ToastDismissButton label={closeLabel} onClose={handleClose} />
      <p className={styles.message}>{message}</p>
    </div>
  );
}

ToastView.propTypes = {
  open: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  closeLabel: PropTypes.string.isRequired,
  handleClose: PropTypes.func.isRequired,
  inlineStyle: PropTypes.shape({}),
};

ToastView.defaultProps = {
  inlineStyle: undefined,
};

export default ToastView;
