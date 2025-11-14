import PropTypes from "prop-types";
import styles from "../AvatarEditorModal.module.css";

function ZoomButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      className={styles["zoom-button"]}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {children}
    </button>
  );
}

ZoomButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

export default ZoomButton;
