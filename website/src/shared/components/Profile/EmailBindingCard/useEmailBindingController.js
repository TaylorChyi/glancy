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

const buildViewModelParams = ({
  email,
  mode,
  isSendingCode,
  isVerifying,
  isUnbinding,
  isAwaitingVerification,
  requestedEmail,
  normalizedRequestedEmail,
  draftEmail,
  verificationCode,
  remainingSeconds,
  isSubmitDisabled,
  isVerificationForDraft,
  onStart,
  onCancel,
  onUnbind,
  t,
  handlers,
}) => ({
  email,
  mode,
  isSendingCode,
  isVerifying,
  isUnbinding,
  isAwaitingVerification,
  requestedEmail,
  normalizedRequestedEmail,
  draftEmail,
  verificationCode,
  remainingSeconds,
  isSubmitDisabled,
  isVerificationForDraft,
  onStart,
  onCancel,
  onRequestCode: handlers.handleRequestCode,
  onConfirm: handlers.handleSubmit,
  onUnbind,
  onDraftEmailChange: handlers.handleDraftEmailChange,
  onVerificationCodeChange: handlers.handleVerificationCodeChange,
  t,
});

export default function useEmailBindingController(props) {
  const {
    email,
    mode,
    isSendingCode,
    isVerifying,
    isUnbinding,
    isAwaitingVerification,
    requestedEmail,
    onStart,
    onCancel,
    onRequestCode,
    onConfirm,
    onUnbind,
    t,
  } = props;

  const countdown = useCountdownTimer(COUNTDOWN_SECONDS);
  const state = useEmailBindingState({
    email,
    mode,
    resetCountdown: countdown.reset,
  });
  const normalized = useEmailBindingNormalization(
    state.draftEmail,
    requestedEmail,
  );

  const handlers = useEmailBindingHandlers({
    draftEmail: state.draftEmail,
    setDraftEmail: state.setDraftEmail,
    verificationCode: state.verificationCode,
    setVerificationCode: state.setVerificationCode,
    onRequestCode,
    onConfirm,
    startCountdown: countdown.start,
  });

  const isSubmitDisabled = computeSubmitDisabled(
    normalized.isVerificationForDraft,
    isAwaitingVerification,
    isVerifying,
  );

  return createEmailBindingViewModel(
    buildViewModelParams({
      email,
      mode,
      isSendingCode,
      isVerifying,
      isUnbinding,
      isAwaitingVerification,
      requestedEmail,
      normalizedRequestedEmail: normalized.normalizedRequestedEmail,
      draftEmail: state.draftEmail,
      verificationCode: state.verificationCode,
      remainingSeconds: countdown.remainingSeconds,
      isSubmitDisabled,
      isVerificationForDraft: normalized.isVerificationForDraft,
      onStart,
      onCancel,
      onUnbind,
      t,
      handlers,
    }),
  );
}
