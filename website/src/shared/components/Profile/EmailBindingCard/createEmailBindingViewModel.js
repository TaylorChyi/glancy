import deriveEmailBindingMetadata from "./viewModel/metadataBuilder.js";
import createHeaderViewModel from "./viewModel/headerBuilder.js";
import createEditingViewModel from "./viewModel/editingBuilder.js";
import createSummaryViewModel from "./viewModel/summaryBuilder.js";

export default function createEmailBindingViewModel(params) {
  const metadata = deriveEmailBindingMetadata({
    email: params.email,
    t: params.t,
    isAwaitingVerification: params.isAwaitingVerification,
    isVerificationForDraft: params.isVerificationForDraft,
    normalizedRequestedEmail: params.normalizedRequestedEmail,
    requestedEmail: params.requestedEmail,
    remainingSeconds: params.remainingSeconds,
  });

  const header = createHeaderViewModel({ metadata, t: params.t });

  const editing = createEditingViewModel({
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

  const summary = createSummaryViewModel({
    metadata,
    email: params.email,
    t: params.t,
    onStart: params.onStart,
    isUnbinding: params.isUnbinding,
    onUnbind: params.onUnbind,
    mode: params.mode,
  });

  return { header, editing, summary };
}
