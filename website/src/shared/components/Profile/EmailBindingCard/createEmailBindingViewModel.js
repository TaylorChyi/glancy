import deriveEmailBindingMetadata from "./viewModel/metadataBuilder.js";
import createHeaderViewModel from "./viewModel/headerBuilder.js";
import createEditingViewModel from "./viewModel/editingBuilder.js";
import createSummaryViewModel from "./viewModel/summaryBuilder.js";

const buildMetadata = (params) =>
  deriveEmailBindingMetadata({
    email: params.email,
    t: params.t,
    isAwaitingVerification: params.isAwaitingVerification,
    isVerificationForDraft: params.isVerificationForDraft,
    normalizedRequestedEmail: params.normalizedRequestedEmail,
    requestedEmail: params.requestedEmail,
    remainingSeconds: params.remainingSeconds,
  });

const buildHeader = (params, metadata) =>
  createHeaderViewModel({ metadata, t: params.t });

const buildEditing = (params, metadata) =>
  createEditingViewModel({
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

const buildSummary = (params, metadata) =>
  createSummaryViewModel({
    metadata,
    email: params.email,
    t: params.t,
    onStart: params.onStart,
    isUnbinding: params.isUnbinding,
    onUnbind: params.onUnbind,
    mode: params.mode,
  });

export default function createEmailBindingViewModel(params) {
  const metadata = buildMetadata(params);

  return {
    header: buildHeader(params, metadata),
    editing: buildEditing(params, metadata),
    summary: buildSummary(params, metadata),
  };
}
