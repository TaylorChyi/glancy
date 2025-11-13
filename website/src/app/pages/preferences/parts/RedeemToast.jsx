import PropTypes from "prop-types";
import Toast from "@shared/components/ui/Toast";

function RedeemToast({ toast }) {
  if (!toast) {
    return null;
  }
  return (
    <Toast
      open={toast.open}
      message={toast.message}
      duration={toast.duration}
      backgroundColor={toast.backgroundColor}
      textColor={toast.textColor}
      closeLabel={toast.closeLabel}
      onClose={toast.onClose}
    />
  );
}

RedeemToast.propTypes = {
  toast: PropTypes.shape({
    open: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    duration: PropTypes.number,
    backgroundColor: PropTypes.string,
    textColor: PropTypes.string,
    closeLabel: PropTypes.string,
    onClose: PropTypes.func,
  }),
};

RedeemToast.defaultProps = {
  toast: undefined,
};

export default RedeemToast;
