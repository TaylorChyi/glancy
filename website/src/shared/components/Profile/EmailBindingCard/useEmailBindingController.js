import createEmailBindingViewModel from "./createEmailBindingViewModel.js";
import useCountdownTimer from "./useCountdownTimer.js";
import useEmailBindingHandlers from "./useEmailBindingHandlers.js";
import useEmailBindingNormalization from "./useEmailBindingNormalization.js";
import useEmailBindingState from "./useEmailBindingState.js";

const COUNTDOWN_SECONDS = 60;

const computeSubmitDisabled = (
  isVerificationForDraft,
  isAwaitingVerification,
  isVerifying,
) => !isVerificationForDraft || !isAwaitingVerification || isVerifying;

function useEmailBindingPreparation(props) {
  const countdown = useCountdownTimer(COUNTDOWN_SECONDS);
  const state = useEmailBindingState({
    email: props.email,
    mode: props.mode,
    resetCountdown: countdown.reset,
  });
  const normalized = useEmailBindingNormalization(
    state.draftEmail,
    props.requestedEmail,
  );
  const handlers = useEmailBindingHandlers({
    draftEmail: state.draftEmail,
    setDraftEmail: state.setDraftEmail,
    verificationCode: state.verificationCode,
    setVerificationCode: state.setVerificationCode,
    onRequestCode: props.onRequestCode,
    onConfirm: props.onConfirm,
    startCountdown: countdown.start,
  });
  const isSubmitDisabled = computeSubmitDisabled(
    normalized.isVerificationForDraft,
    props.isAwaitingVerification,
    props.isVerifying,
  );

  return {
    countdown,
    state,
    normalized,
    handlers,
    isSubmitDisabled,
  };
}

function mapToViewModelParams(props, preparation) {
  return {
    email: props.email,
    mode: props.mode,
    isSendingCode: props.isSendingCode,
    isVerifying: props.isVerifying,
    isUnbinding: props.isUnbinding,
    isAwaitingVerification: props.isAwaitingVerification,
    requestedEmail: props.requestedEmail,
    normalizedRequestedEmail:
      preparation.normalized.normalizedRequestedEmail,
    draftEmail: preparation.state.draftEmail,
    verificationCode: preparation.state.verificationCode,
    remainingSeconds: preparation.countdown.remainingSeconds,
    isSubmitDisabled: preparation.isSubmitDisabled,
    isVerificationForDraft: preparation.normalized.isVerificationForDraft,
    onStart: props.onStart,
    onCancel: props.onCancel,
    onUnbind: props.onUnbind,
    t: props.t,
    onRequestCode: preparation.handlers.handleRequestCode,
    onConfirm: preparation.handlers.handleSubmit,
    onDraftEmailChange: preparation.handlers.handleDraftEmailChange,
    onVerificationCodeChange:
      preparation.handlers.handleVerificationCodeChange,
  };
}

export default function useEmailBindingController(props) {
  const preparation = useEmailBindingPreparation(props);
  const viewModelParams = mapToViewModelParams(props, preparation);
  return createEmailBindingViewModel(viewModelParams);
}
