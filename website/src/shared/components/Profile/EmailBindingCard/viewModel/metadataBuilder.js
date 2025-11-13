const buildStatusTone = (hasBoundEmail) =>
  hasBoundEmail
    ? { label: "status-active", text: "active" }
    : { label: "status-inactive", text: "inactive" };

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

export default function deriveEmailBindingMetadata({
  email,
  t,
  isAwaitingVerification,
  isVerificationForDraft,
  normalizedRequestedEmail,
  requestedEmail,
  remainingSeconds,
}) {
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
}

export { deriveEmailBindingMetadata };
