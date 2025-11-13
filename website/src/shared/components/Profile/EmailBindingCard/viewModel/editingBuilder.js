const buildFlowViewModel = (t, isAwaitingVerification) => ({
  stepInputLabel: t.emailStepInput,
  stepVerifyLabel: t.emailStepVerify,
  isAwaitingVerification,
});

const buildEmailFieldViewModel = (draftEmail, onDraftEmailChange, t) => ({
  value: draftEmail,
  onChange: onDraftEmailChange,
  label: t.emailInputLabel,
  placeholder: t.emailInputPlaceholder,
  helper: t.emailVerificationIntro,
});

const buildCodeFieldViewModel = ({
  verificationCode,
  onVerificationCodeChange,
  verificationMessage,
  isAwaitingVerification,
  t,
}) => ({
  value: verificationCode,
  onChange: onVerificationCodeChange,
  label: t.emailCodeLabel,
  placeholder: t.emailCodePlaceholder,
  helper: verificationMessage,
  disabled: !isAwaitingVerification,
});

const buildSendCodeButtonViewModel = ({
  isSendingCode,
  sendCodeLabel,
  onRequestCode,
  remainingSeconds,
  t,
}) => ({
  label: isSendingCode ? t.emailSendingCode : sendCodeLabel,
  onClick: onRequestCode,
  disabled: isSendingCode || remainingSeconds > 0,
});

const buildConfirmButtonViewModel = ({
  isVerifying,
  confirmButtonLabel,
  isSubmitDisabled,
  t,
}) => ({
  label: isVerifying ? t.emailVerifying : confirmButtonLabel,
  disabled: isSubmitDisabled,
});

const buildCancelButtonViewModel = (t, onCancel) => ({
  label: t.emailCancel,
  onClick: onCancel,
});

const buildEditingViewModel = ({
  mode,
  flow,
  emailField,
  codeField,
  sendCodeButton,
  confirmButton,
  cancelButton,
  onConfirm,
}) => ({
  isActive: mode === "editing",
  flow,
  emailField,
  codeField,
  sendCodeButton,
  confirmButton,
  cancelButton,
  onSubmit: onConfirm,
});

export default function createEditingViewModel({
  metadata,
  mode,
  t,
  isAwaitingVerification,
  draftEmail,
  onDraftEmailChange,
  verificationCode,
  onVerificationCodeChange,
  isSendingCode,
  onRequestCode,
  remainingSeconds,
  isVerifying,
  isSubmitDisabled,
  onCancel,
  onConfirm,
}) {
  const flow = buildFlowViewModel(t, isAwaitingVerification);
  const emailField = buildEmailFieldViewModel(
    draftEmail,
    onDraftEmailChange,
    t,
  );
  const codeField = buildCodeFieldViewModel({
    verificationCode,
    onVerificationCodeChange,
    verificationMessage: metadata.verificationMessage,
    isAwaitingVerification,
    t,
  });
  const sendCodeButton = buildSendCodeButtonViewModel({
    isSendingCode,
    sendCodeLabel: metadata.sendCodeLabel,
    onRequestCode,
    remainingSeconds,
    t,
  });
  const confirmButton = buildConfirmButtonViewModel({
    isVerifying,
    confirmButtonLabel: metadata.confirmButtonLabel,
    isSubmitDisabled,
    t,
  });
  const cancelButton = buildCancelButtonViewModel(t, onCancel);

  return buildEditingViewModel({
    mode,
    flow,
    emailField,
    codeField,
    sendCodeButton,
    confirmButton,
    cancelButton,
    onConfirm,
  });
}

export { createEditingViewModel };
