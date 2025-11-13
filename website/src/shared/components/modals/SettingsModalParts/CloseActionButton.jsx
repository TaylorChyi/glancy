import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon";
import modalStyles from "../SettingsModal.module.css";

function CloseActionButton({ className, label, onClose }) {
  const composedClassName = [modalStyles["close-button"], className]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      onClick={onClose}
      className={composedClassName}
      aria-label={label}
    >
      <ThemeIcon name="close" width={20} height={20} decorative />
    </button>
  );
}

CloseActionButton.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

CloseActionButton.defaultProps = {
  className: "",
};

export default CloseActionButton;
