const mapEmailBindingToViewModel = (props, preparation) => ({
  email: props.email,
  mode: props.mode,
  isSendingCode: props.isSendingCode,
  isVerifying: props.isVerifying,
  isUnbinding: props.isUnbinding,
  isAwaitingVerification: props.isAwaitingVerification,
  requestedEmail: props.requestedEmail,
  normalizedRequestedEmail: preparation.normalized.normalizedRequestedEmail,
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
  onVerificationCodeChange: preparation.handlers.handleVerificationCodeChange,
});

export default mapEmailBindingToViewModel;
export { mapEmailBindingToViewModel };
