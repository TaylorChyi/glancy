/**
 * 背景：
 *  - 组件原本直接在渲染函数中拼接大量派生文案与状态判断，导致认知复杂度高。
 * 目的：
 *  - 将纯计算逻辑集中到视图模型生成器，确保 UI 层仅负责 JSX 渲染。
 * 关键决策与取舍：
 *  - 采用可读性优先的命名字段（header/editing/summary），方便未来扩展；
 *  - 在视图模型阶段完成所有文案替换与禁用判断，减轻视图层判断分支。
 * 影响范围：
 *  - EmailBindingCard 的渲染数据来源；
 *  - 单测可直接断言视图模型输出以覆盖边界条件。
 * 演进与TODO：
 *  - 若后续引入多步骤流程，可在此扩展 flow.sections 支持动态步骤数量。
 */
const buildStatusTone = (hasBoundEmail) =>
  hasBoundEmail ? { label: "status-active", text: "active" } : { label: "status-inactive", text: "inactive" };

const buildSummaryLabel = (hasBoundEmail, t) =>
  hasBoundEmail ? t.emailBoundDescription : t.emailUnboundDescription;

const buildPrimaryActionLabel = (hasBoundEmail, t) =>
  hasBoundEmail ? t.emailChangeAction : t.emailBindAction;

const buildConfirmLabel = (hasBoundEmail, t) =>
  hasBoundEmail ? t.emailConfirmChange : t.emailConfirmBind;

const buildVerificationMessage = ({
  isAwaitingVerification,
  isVerificationForDraft,
  normalizedRequestedEmail,
  requestedEmail,
  t,
}) => {
  if (!isAwaitingVerification) {
    return t.emailAwaitingCode;
  }

  if (!isVerificationForDraft && normalizedRequestedEmail) {
    return t.emailVerificationMismatch.replace("{{email}}", requestedEmail);
  }

  return t.emailVerificationPending.replace("{{email}}", requestedEmail);
};

const buildSendCodeLabel = (remainingSeconds, t) => {
  if (remainingSeconds > 0) {
    return `${remainingSeconds}s`;
  }
  return t.emailSendCode;
};

const buildHeaderViewModel = ({ hasBoundEmail, statusTone, summaryLabel, t }) => ({
  title: t.emailBindingTitle,
  subtitle: summaryLabel,
  statusLabel: hasBoundEmail ? t.emailStatusBound : t.emailStatusUnbound,
  statusTone: statusTone.text,
  statusClassName: statusTone.label,
});

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

const buildConfirmButtonViewModel = ({ isVerifying, confirmButtonLabel, isSubmitDisabled, t }) => ({
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

const buildSummaryViewModel = ({
  hasBoundEmail,
  email,
  t,
  primaryActionLabel,
  onStart,
  isUnbinding,
  onUnbind,
  mode,
}) => ({
  isVisible: mode !== "editing",
  label: t.emailCurrentLabel,
  currentEmail: hasBoundEmail ? email : t.emailEmptyValue,
  primaryActionLabel,
  onStart,
  secondaryActionLabel: isUnbinding ? t.emailUnbinding : t.emailUnbindAction,
  onUnbind,
  isSecondaryDisabled: !hasBoundEmail || isUnbinding,
});

const deriveEmailBindingMetadata = ({
  email,
  t,
  isAwaitingVerification,
  isVerificationForDraft,
  normalizedRequestedEmail,
  requestedEmail,
  remainingSeconds,
}) => {
  const hasBoundEmail = Boolean(email);
  const statusTone = buildStatusTone(hasBoundEmail);
  const summaryLabel = buildSummaryLabel(hasBoundEmail, t);
  const primaryActionLabel = buildPrimaryActionLabel(hasBoundEmail, t);
  const confirmButtonLabel = buildConfirmLabel(hasBoundEmail, t);
  const verificationMessage = buildVerificationMessage({
    isAwaitingVerification,
    isVerificationForDraft,
    normalizedRequestedEmail,
    requestedEmail,
    t,
  });
  const sendCodeLabel = buildSendCodeLabel(remainingSeconds, t);

  return {
    hasBoundEmail,
    statusTone,
    summaryLabel,
    primaryActionLabel,
    confirmButtonLabel,
    verificationMessage,
    sendCodeLabel,
  };
};

const composeEditingViewModel = ({
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
}) => {
  const flow = buildFlowViewModel(t, isAwaitingVerification);
  const emailField = buildEmailFieldViewModel(draftEmail, onDraftEmailChange, t);
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
};

const assembleEmailBindingViewModel = (params) => {
  const metadata = deriveEmailBindingMetadata({
    email: params.email,
    t: params.t,
    isAwaitingVerification: params.isAwaitingVerification,
    isVerificationForDraft: params.isVerificationForDraft,
    normalizedRequestedEmail: params.normalizedRequestedEmail,
    requestedEmail: params.requestedEmail,
    remainingSeconds: params.remainingSeconds,
  });

  const header = buildHeaderViewModel({
    hasBoundEmail: metadata.hasBoundEmail,
    statusTone: metadata.statusTone,
    summaryLabel: metadata.summaryLabel,
    t: params.t,
  });

  const editing = composeEditingViewModel({
    metadata,
    mode: params.mode,
    t: params.t,
    isAwaitingVerification: params.isAwaitingVerification,
    draftEmail: params.draftEmail,
    onDraftEmailChange: params.onDraftEmailChange,
    verificationCode: params.verificationCode,
    onVerificationCodeChange: params.onVerificationCodeChange,
    isSendingCode: params.isSendingCode,
    onRequestCode: params.onRequestCode,
    remainingSeconds: params.remainingSeconds,
    isVerifying: params.isVerifying,
    isSubmitDisabled: params.isSubmitDisabled,
    onCancel: params.onCancel,
    onConfirm: params.onConfirm,
  });

  const summary = buildSummaryViewModel({
    hasBoundEmail: metadata.hasBoundEmail,
    email: params.email,
    t: params.t,
    primaryActionLabel: metadata.primaryActionLabel,
    onStart: params.onStart,
    isUnbinding: params.isUnbinding,
    onUnbind: params.onUnbind,
    mode: params.mode,
  });

  return { header, editing, summary };
};

export default function createEmailBindingViewModel(params) {
  return assembleEmailBindingViewModel(params);
}
