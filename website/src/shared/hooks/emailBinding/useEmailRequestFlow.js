import { useCallback, useRef, useState } from "react";
import {
  ERROR_EMAIL_REQUIRED,
  ERROR_EMAIL_UNCHANGED,
  normalizeEmail,
} from "./constants.js";

function requireNormalizedEmail(nextEmail) {
  const normalized = normalizeEmail(nextEmail);
  if (normalized) {
    return normalized;
  }
  const error = new Error(ERROR_EMAIL_REQUIRED);
  error.code = ERROR_EMAIL_REQUIRED;
  throw error;
}

function ensureEmailChanged(normalizedEmail, currentEmail) {
  const normalizedCurrentEmail = normalizeEmail(currentEmail);
  if (normalizedCurrentEmail && normalizedCurrentEmail === normalizedEmail) {
    const error = new Error(ERROR_EMAIL_UNCHANGED);
    error.code = ERROR_EMAIL_UNCHANGED;
    throw error;
  }
}

function normalizeAndValidateEmail(nextEmail, userEmail) {
  const normalized = requireNormalizedEmail(nextEmail);
  ensureEmailChanged(normalized, userEmail);
  return normalized;
}

function beginRequest(setIsSendingCode) {
  setIsSendingCode(true);
}

function finishRequest(setIsSendingCode) {
  setIsSendingCode(false);
}

function recordRequestSuccess(
  email,
  lastRequestedEmailRef,
  setCodeIssuedAt,
  setLastRequestedEmail,
) {
  const issuedAt = Date.now();
  setCodeIssuedAt(issuedAt);
  lastRequestedEmailRef.current = email;
  setLastRequestedEmail(email);
}

function clearRequestState(
  lastRequestedEmailRef,
  setCodeIssuedAt,
  setLastRequestedEmail,
) {
  setCodeIssuedAt(null);
  lastRequestedEmailRef.current = null;
  setLastRequestedEmail(null);
}

export function useEmailRequestFlow({ client, ensureClient, user }) {
  const lastRequestedEmailRef = useRef(null);
  const [lastRequestedEmail, setLastRequestedEmail] = useState(null);
  const [codeIssuedAt, setCodeIssuedAt] = useState(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const resetRequestState = useCallback(() => {
    clearRequestState(lastRequestedEmailRef, setCodeIssuedAt, setLastRequestedEmail);
  }, []);
  const requestCode = useCallback(
    async (nextEmail) => {
      ensureClient();
      const normalized = normalizeAndValidateEmail(nextEmail, user?.email);
      try {
        beginRequest(setIsSendingCode);
        await client.requestEmailChangeCode({ userId: user.id, email: normalized, token: user.token });
        recordRequestSuccess(normalized, lastRequestedEmailRef, setCodeIssuedAt, setLastRequestedEmail);
        return true;
      } finally {
        finishRequest(setIsSendingCode);
      }
    },
    [client, ensureClient, user?.email, user?.id, user?.token],
  );
  return { requestCode, isSendingCode, codeIssuedAt, lastRequestedEmail, lastRequestedEmailRef, resetRequestState };
}
