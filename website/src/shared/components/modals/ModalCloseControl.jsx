import PropTypes from "prop-types";
import styles from "./Modal.module.css";

function ModalCloseControl({
  closeButton,
  shouldRenderDefaultCloseButton,
  closeLabel,
  onClose,
}) {
  if (closeButton) {
    return <div className={styles["close-slot"]}>{closeButton}</div>;
  }
  if (!shouldRenderDefaultCloseButton) {
    return null;
  }
  return (
    <button
      type="button"
      className={styles["close-button"]}
      aria-label={closeLabel}
      onClick={onClose}
    >
      <span aria-hidden="true">&times;</span>
    </button>
  );
}

ModalCloseControl.propTypes = {
  closeButton: PropTypes.node,
  shouldRenderDefaultCloseButton: PropTypes.bool.isRequired,
  closeLabel: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

ModalCloseControl.defaultProps = {
  closeButton: null,
};

export default ModalCloseControl;
