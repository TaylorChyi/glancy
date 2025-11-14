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

export default function useEmailBindingPreparation(props) {
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

export { useEmailBindingPreparation, computeSubmitDisabled };
