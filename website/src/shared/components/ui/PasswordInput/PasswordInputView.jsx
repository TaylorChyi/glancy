import { forwardRef } from "react";
import PropTypes from "prop-types";
import PasswordToggleButton from "./parts/PasswordToggleButton.jsx";

const PasswordInputView = forwardRef(function PasswordInputView(
  { wrapperClassName, inputProps, toggle },
  ref,
) {
  return (
    <div className={wrapperClassName} data-visible={toggle.allowToggle && toggle.visible}>
      <input {...inputProps} ref={ref} />
      <PasswordToggleButton {...toggle} />
    </div>
  );
});

PasswordInputView.propTypes = {
  wrapperClassName: PropTypes.string.isRequired,
  inputProps: PropTypes.shape({
    type: PropTypes.string.isRequired,
    disabled: PropTypes.bool.isRequired,
    className: PropTypes.string.isRequired,
    autoComplete: PropTypes.string,
  }).isRequired,
  toggle: PropTypes.shape({
    allowToggle: PropTypes.bool.isRequired,
    handleToggle: PropTypes.func.isRequired,
    ariaLabel: PropTypes.string.isRequired,
    visible: PropTypes.bool.isRequired,
    iconSize: PropTypes.number.isRequired,
    className: PropTypes.string.isRequired,
  }).isRequired,
};

export default PasswordInputView;
