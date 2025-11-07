import PropTypes from "prop-types";
import useEmailBindingController from "./useEmailBindingController.js";
import EmailBindingCardView from "./EmailBindingCardView.jsx";

function EmailBindingCard(props) {
  const viewModel = useEmailBindingController(props);
  return <EmailBindingCardView {...viewModel} />;
}

EmailBindingCard.propTypes = {
  email: PropTypes.string,
  mode: PropTypes.string.isRequired,
  isSendingCode: PropTypes.bool,
  isVerifying: PropTypes.bool,
  isUnbinding: PropTypes.bool,
  isAwaitingVerification: PropTypes.bool,
  requestedEmail: PropTypes.string,
  onStart: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onRequestCode: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onUnbind: PropTypes.func.isRequired,
  t: PropTypes.shape({
    emailBindingTitle: PropTypes.string.isRequired,
    emailBoundDescription: PropTypes.string.isRequired,
    emailUnboundDescription: PropTypes.string.isRequired,
    emailStatusBound: PropTypes.string.isRequired,
    emailStatusUnbound: PropTypes.string.isRequired,
    emailInputLabel: PropTypes.string.isRequired,
    emailInputPlaceholder: PropTypes.string.isRequired,
    emailCodeLabel: PropTypes.string.isRequired,
    emailCodePlaceholder: PropTypes.string.isRequired,
    emailSendCode: PropTypes.string.isRequired,
    emailSendingCode: PropTypes.string.isRequired,
    emailVerifying: PropTypes.string.isRequired,
    emailConfirmBind: PropTypes.string.isRequired,
    emailConfirmChange: PropTypes.string.isRequired,
    emailCancel: PropTypes.string.isRequired,
    emailCurrentLabel: PropTypes.string.isRequired,
    emailEmptyValue: PropTypes.string.isRequired,
    emailChangeAction: PropTypes.string.isRequired,
    emailBindAction: PropTypes.string.isRequired,
    emailUnbindAction: PropTypes.string.isRequired,
    emailUnbinding: PropTypes.string.isRequired,
    emailVerificationIntro: PropTypes.string.isRequired,
    emailAwaitingCode: PropTypes.string.isRequired,
    emailVerificationPending: PropTypes.string.isRequired,
    emailVerificationMismatch: PropTypes.string.isRequired,
    emailStepInput: PropTypes.string.isRequired,
    emailStepVerify: PropTypes.string.isRequired,
  }).isRequired,
};

EmailBindingCard.defaultProps = {
  email: "",
  isSendingCode: false,
  isVerifying: false,
  isUnbinding: false,
  isAwaitingVerification: false,
  requestedEmail: "",
};

export default EmailBindingCard;
