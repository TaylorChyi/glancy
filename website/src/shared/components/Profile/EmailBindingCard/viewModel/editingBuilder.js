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

const assembleEditingComponents = (options) => ({
  flow: buildFlowViewModel(options.t, options.isAwaitingVerification),
  emailField: buildEmailFieldViewModel(
    options.draftEmail,
    options.onDraftEmailChange,
    options.t,
  ),
  codeField: buildCodeFieldViewModel({
    verificationCode: options.verificationCode,
    onVerificationCodeChange: options.onVerificationCodeChange,
    verificationMessage: options.metadata.verificationMessage,
    isAwaitingVerification: options.isAwaitingVerification,
    t: options.t,
  }),
  sendCodeButton: buildSendCodeButtonViewModel({
    isSendingCode: options.isSendingCode,
    sendCodeLabel: options.metadata.sendCodeLabel,
    onRequestCode: options.onRequestCode,
    remainingSeconds: options.remainingSeconds,
    t: options.t,
  }),
  confirmButton: buildConfirmButtonViewModel({
    isVerifying: options.isVerifying,
    confirmButtonLabel: options.metadata.confirmButtonLabel,
    isSubmitDisabled: options.isSubmitDisabled,
    t: options.t,
  }),
  cancelButton: buildCancelButtonViewModel(options.t, options.onCancel),
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
