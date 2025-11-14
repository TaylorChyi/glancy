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

const assembleEditingComponents = ({
  metadata,
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
}) => ({
  flow: buildFlowViewModel(t, isAwaitingVerification),
  emailField: buildEmailFieldViewModel(
    draftEmail,
    onDraftEmailChange,
    t,
  ),
  codeField: buildCodeFieldViewModel({
    verificationCode,
    onVerificationCodeChange,
    verificationMessage: metadata.verificationMessage,
    isAwaitingVerification,
    t,
  }),
  sendCodeButton: buildSendCodeButtonViewModel({
    isSendingCode,
    sendCodeLabel: metadata.sendCodeLabel,
    onRequestCode,
    remainingSeconds,
    t,
  }),
  confirmButton: buildConfirmButtonViewModel({
    isVerifying,
    confirmButtonLabel: metadata.confirmButtonLabel,
    isSubmitDisabled,
    t,
  }),
  cancelButton: buildCancelButtonViewModel(t, onCancel),
});

export default function createEditingViewModel(options) {
  const { mode, onConfirm } = options;
  const components = assembleEditingComponents(options);

  return buildEditingViewModel({
    mode,
    ...components,
    onConfirm,
  });
}

export { createEditingViewModel, assembleEditingComponents };
