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

const useEmailBindingStateInitialization = (props) => {
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

  return { countdown, state, normalized };
};

const computeSubmitState = (normalized, props) => ({
  isSubmitDisabled: computeSubmitDisabled(
    normalized.isVerificationForDraft,
    props.isAwaitingVerification,
    props.isVerifying,
  ),
});

export default function useEmailBindingPreparation(props) {
  const { countdown, state, normalized } =
    useEmailBindingStateInitialization(props);
  const handlers = useEmailBindingHandlers({
    draftEmail: state.draftEmail,
    setDraftEmail: state.setDraftEmail,
    verificationCode: state.verificationCode,
    setVerificationCode: state.setVerificationCode,
    onRequestCode: props.onRequestCode,
    onConfirm: props.onConfirm,
    startCountdown: countdown.start,
  });
  const submitState = computeSubmitState(normalized, props);

  return {
    countdown,
    state,
    normalized,
    handlers,
    ...submitState,
  };
}

export {
  useEmailBindingPreparation,
  computeSubmitDisabled,
  useEmailBindingStateInitialization,
  computeSubmitState,
};
