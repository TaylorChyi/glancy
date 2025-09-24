import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import styles from "./EmailBindingCard.module.css";

const COUNTDOWN_SECONDS = 60;

function EmailBindingCard({
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
}) {
  const [draftEmail, setDraftEmail] = useState(email ?? "");
  const [verificationCode, setVerificationCode] = useState("");
  const [cooldownEnd, setCooldownEnd] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    setDraftEmail(email ?? "");
    if (mode === "idle") {
      setVerificationCode("");
      setCooldownEnd(null);
      setRemainingSeconds(0);
    }
  }, [email, mode]);

  useEffect(() => {
    if (!cooldownEnd) {
      setRemainingSeconds(0);
      return undefined;
    }

    const update = () => {
      const diff = cooldownEnd - Date.now();
      if (diff <= 0) {
        setRemainingSeconds(0);
        setCooldownEnd(null);
        return;
      }
      setRemainingSeconds(Math.ceil(diff / 1000));
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [cooldownEnd]);

  const sendCodeLabel = useMemo(() => {
    if (remainingSeconds > 0) {
      return `${remainingSeconds}s`;
    }
    return t.emailSendCode;
  }, [remainingSeconds, t.emailSendCode]);

  const normalizedDraftEmail = useMemo(
    () => draftEmail.trim().toLowerCase(),
    [draftEmail],
  );

  const normalizedRequestedEmail = useMemo(
    () => requestedEmail?.trim().toLowerCase() ?? "",
    [requestedEmail],
  );

  const isVerificationForDraft =
    Boolean(normalizedDraftEmail) &&
    Boolean(normalizedRequestedEmail) &&
    normalizedDraftEmail === normalizedRequestedEmail;

  const isSubmitDisabled =
    !isVerificationForDraft || !isAwaitingVerification || isVerifying;

  const handleRequestCode = async () => {
    if (typeof onRequestCode !== "function") return;
    const result = await onRequestCode(draftEmail);
    if (result === false) return;
    setVerificationCode("");
    setCooldownEnd(Date.now() + COUNTDOWN_SECONDS * 1000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (typeof onConfirm !== "function") return;
    await onConfirm({ email: draftEmail, code: verificationCode });
  };

  const isEditing = mode === "editing";
  const summaryLabel = email
    ? t.emailBoundDescription
    : t.emailUnboundDescription;

  const verificationMessage = useMemo(() => {
    if (!isAwaitingVerification) {
      return t.emailAwaitingCode;
    }

    if (!isVerificationForDraft && normalizedRequestedEmail) {
      return t.emailVerificationMismatch.replace("{{email}}", requestedEmail);
    }

    return t.emailVerificationPending.replace("{{email}}", requestedEmail);
  }, [
    isAwaitingVerification,
    isVerificationForDraft,
    normalizedRequestedEmail,
    requestedEmail,
    t.emailAwaitingCode,
    t.emailVerificationMismatch,
    t.emailVerificationPending,
  ]);

  return (
    <section className={styles.card} aria-label={t.emailBindingTitle}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.title}>{t.emailBindingTitle}</h3>
          <p className={styles.subtitle}>{summaryLabel}</p>
        </div>
        <span
          className={
            email ? styles["status-active"] : styles["status-inactive"]
          }
        >
          {email ? t.emailStatusBound : t.emailStatusUnbound}
        </span>
      </header>
      {isEditing ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.flow} aria-hidden="true">
            <div className={styles["flow-item"]}>
              <span
                className={`${styles["flow-dot"]} ${styles["flow-dot-active"]}`}
              >
                1
              </span>
              <span className={styles["flow-label"]}>{t.emailStepInput}</span>
            </div>
            <span className={styles["flow-divider"]} />
            <div className={styles["flow-item"]}>
              <span
                className={`${styles["flow-dot"]} ${
                  isAwaitingVerification ? styles["flow-dot-active"] : ""
                }`}
              >
                2
              </span>
              <span className={styles["flow-label"]}>{t.emailStepVerify}</span>
            </div>
          </div>
          <label className={styles.field}>
            <span className={styles.label}>{t.emailInputLabel}</span>
            <input
              value={draftEmail}
              onChange={(event) => setDraftEmail(event.target.value)}
              className={styles.input}
              placeholder={t.emailInputPlaceholder}
              type="email"
              required
            />
            <span className={styles.helper}>{t.emailVerificationIntro}</span>
          </label>
          <div className={styles["code-row"]}>
            <label className={styles["code-field"]}>
              <span className={styles.label}>{t.emailCodeLabel}</span>
              <input
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                className={styles.input}
                placeholder={t.emailCodePlaceholder}
                inputMode="numeric"
                maxLength={8}
                required
                disabled={!isAwaitingVerification}
              />
              <span className={styles.helper}>{verificationMessage}</span>
            </label>
            <button
              type="button"
              className={styles["secondary-button"]}
              onClick={handleRequestCode}
              disabled={isSendingCode || remainingSeconds > 0}
            >
              {isSendingCode ? t.emailSendingCode : sendCodeLabel}
            </button>
          </div>
          <div className={styles["form-actions"]}>
            <button
              type="submit"
              className={styles["primary-button"]}
              disabled={isSubmitDisabled}
            >
              {isVerifying ? t.emailVerifying : t.emailConfirm}
            </button>
            <button
              type="button"
              className={styles["ghost-button"]}
              onClick={onCancel}
            >
              {t.emailCancel}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.summary}>
          <div className={styles["summary-info"]}>
            <span className={styles["summary-label"]}>
              {t.emailCurrentLabel}
            </span>
            <span className={styles["summary-value"]}>
              {email || t.emailEmptyValue}
            </span>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles["primary-button"]}
              onClick={onStart}
            >
              {t.emailChangeAction}
            </button>
            <button
              type="button"
              className={styles["secondary-button"]}
              onClick={onUnbind}
              disabled={!email || isUnbinding}
            >
              {isUnbinding ? t.emailUnbinding : t.emailUnbindAction}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

EmailBindingCard.propTypes = {
  email: PropTypes.string,
  mode: PropTypes.string.isRequired,
  isSendingCode: PropTypes.bool,
  isVerifying: PropTypes.bool,
  isUnbinding: PropTypes.bool,
  isAwaitingVerification: PropTypes.bool,
  requestedEmail: PropTypes.string,
  onStart: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onRequestCode: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onUnbind: PropTypes.func.isRequired,
  t: PropTypes.shape({
    emailBindingTitle: PropTypes.string.isRequired,
    emailBoundDescription: PropTypes.string.isRequired,
    emailUnboundDescription: PropTypes.string.isRequired,
    emailStatusBound: PropTypes.string.isRequired,
    emailStatusUnbound: PropTypes.string.isRequired,
    emailInputLabel: PropTypes.string.isRequired,
    emailInputPlaceholder: PropTypes.string.isRequired,
    emailCodeLabel: PropTypes.string.isRequired,
    emailCodePlaceholder: PropTypes.string.isRequired,
    emailSendCode: PropTypes.string.isRequired,
    emailSendingCode: PropTypes.string.isRequired,
    emailVerifying: PropTypes.string.isRequired,
    emailConfirm: PropTypes.string.isRequired,
    emailCancel: PropTypes.string.isRequired,
    emailCurrentLabel: PropTypes.string.isRequired,
    emailEmptyValue: PropTypes.string.isRequired,
    emailChangeAction: PropTypes.string.isRequired,
    emailUnbindAction: PropTypes.string.isRequired,
    emailUnbinding: PropTypes.string.isRequired,
    emailVerificationIntro: PropTypes.string.isRequired,
    emailAwaitingCode: PropTypes.string.isRequired,
    emailVerificationPending: PropTypes.string.isRequired,
    emailVerificationMismatch: PropTypes.string.isRequired,
    emailStepInput: PropTypes.string.isRequired,
    emailStepVerify: PropTypes.string.isRequired,
  }).isRequired,
};

EmailBindingCard.defaultProps = {
  email: "",
  isSendingCode: false,
  isVerifying: false,
  isUnbinding: false,
  isAwaitingVerification: false,
  requestedEmail: "",
};

export default EmailBindingCard;
