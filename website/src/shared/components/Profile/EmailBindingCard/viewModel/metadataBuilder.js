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

  return {
    hasBoundEmail,
    statusTone: buildStatusTone(hasBoundEmail),
    summaryLabel: buildSummaryLabel(hasBoundEmail, t),
    primaryActionLabel: buildPrimaryActionLabel(hasBoundEmail, t),
    confirmButtonLabel: buildConfirmLabel(hasBoundEmail, t),
    verificationMessage: buildVerificationMessage({
      isAwaitingVerification,
      isVerificationForDraft,
      normalizedRequestedEmail,
      requestedEmail,
      t,
    }),
    sendCodeLabel: buildSendCodeLabel(remainingSeconds, t),
  };
}

export { deriveEmailBindingMetadata };
