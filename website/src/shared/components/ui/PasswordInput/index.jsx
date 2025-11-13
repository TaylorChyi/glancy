import { forwardRef } from "react";
import PropTypes from "prop-types";
import PasswordInputView from "./PasswordInputView.jsx";
import {
  usePasswordInputModel,
  usePasswordVisibility,
} from "./usePasswordInputModel.ts";

const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const { viewProps } = usePasswordInputModel(props);
  return <PasswordInputView ref={ref} {...viewProps} />;
});

PasswordInput.propTypes = {
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  toggleClassName: PropTypes.string,
  defaultVisible: PropTypes.bool,
  onVisibilityChange: PropTypes.func,
  labels: PropTypes.shape({
    show: PropTypes.string,
    hide: PropTypes.string,
  }),
  iconSize: PropTypes.number,
  mask: PropTypes.bool,
  disabled: PropTypes.bool,
  autoComplete: PropTypes.string,
};

PasswordInput.defaultProps = {
  className: "",
  inputClassName: "",
  toggleClassName: "",
  defaultVisible: false,
  onVisibilityChange: undefined,
  labels: undefined,
  iconSize: 20,
  mask: true,
  disabled: false,
  autoComplete: undefined,
};

export { usePasswordVisibility };
export default PasswordInput;
