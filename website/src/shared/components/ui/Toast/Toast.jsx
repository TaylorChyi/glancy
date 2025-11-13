import PropTypes from "prop-types";
import ToastView from "./ToastView.jsx";
import { useToastModel } from "./useToastModel.ts";

function Toast(props) {
  const { viewProps } = useToastModel(props);
  return <ToastView {...viewProps} />;
}

Toast.propTypes = {
  open: PropTypes.bool,
  message: PropTypes.string,
  duration: PropTypes.number,
  onClose: PropTypes.func,
  backgroundColor: PropTypes.string,
  textColor: PropTypes.string,
  closeLabel: PropTypes.string,
};

Toast.defaultProps = {
  open: false,
  message: "",
  duration: 3000,
  onClose: undefined,
  backgroundColor: undefined,
  textColor: undefined,
  closeLabel: "Dismiss notification",
};

export default Toast;
