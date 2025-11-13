import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon";

function PasswordToggleButton({
  allowToggle,
  handleToggle,
  ariaLabel,
  visible,
  iconSize,
  className,
}) {
  if (!allowToggle) {
    return null;
  }
  return (
    <button
      type="button"
      className={className}
      onClick={handleToggle}
      aria-label={ariaLabel}
      aria-pressed={visible}
    >
      <ThemeIcon
        name={visible ? "eye-off" : "eye"}
        width={iconSize}
        height={iconSize}
        alt={ariaLabel}
      />
    </button>
  );
}

PasswordToggleButton.propTypes = {
  allowToggle: PropTypes.bool.isRequired,
  handleToggle: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired,
  iconSize: PropTypes.number.isRequired,
  className: PropTypes.string.isRequired,
};

export default PasswordToggleButton;
