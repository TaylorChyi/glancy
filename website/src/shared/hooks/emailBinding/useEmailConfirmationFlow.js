import { useState } from "react";
import {
  ERROR_CODE_REQUIRED,
  ERROR_EMAIL_MISMATCH,
  ERROR_EMAIL_REQUIRED,
  ERROR_MISSING_REQUEST,
  normalizeEmail,
} from "./constants.js";

function createValidationError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function validateEmailAndCode(email, code) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = code?.trim();

  if (!normalizedEmail) {
    throw createValidationError(ERROR_EMAIL_REQUIRED);
  }

  if (!normalizedCode) {
    throw createValidationError(ERROR_CODE_REQUIRED);
  }

  return { normalizedEmail, normalizedCode };
}

function ensureRequestedEmail({ lastRequestedEmailRef, normalizedEmail }) {
  const requestedEmail = lastRequestedEmailRef.current;

  if (!requestedEmail) {
    throw createValidationError(ERROR_MISSING_REQUEST);
  }

  if (normalizeEmail(requestedEmail) !== normalizedEmail) {
    const error = createValidationError(ERROR_EMAIL_MISMATCH);
    error.meta = { requestedEmail };
    throw error;
  }

  return requestedEmail;
}

async function withVerificationState(setIsVerifying, action) {
  setIsVerifying(true);
  try {
    return await action();
  } finally {
    setIsVerifying(false);
  }
}

function confirmEmailChangeRequest({ client, user, normalizedEmail, normalizedCode }) {
  return client.confirmEmailChange({
    userId: user.id,
    email: normalizedEmail,
    code: normalizedCode,
    token: user.token,
  });
}

function handleSuccessfulConfirmation({
  response,
  user,
  onUserUpdate,
  resetRequestState,
  onSuccess,
}) {
  const updatedEmail = response?.email ?? null;
  if (typeof onUserUpdate === "function" && user) {
    onUserUpdate({ ...user, email: updatedEmail });
  }
  resetRequestState();
  if (typeof onSuccess === "function") {
    onSuccess(updatedEmail);
  }
  return updatedEmail;
}

function runConfirmationRequest({
  client,
  user,
  normalizedEmail,
  normalizedCode,
  setIsVerifying,
  onUserUpdate,
  resetRequestState,
  onSuccess,
}) {
  return withVerificationState(setIsVerifying, async () => {
    const response = await confirmEmailChangeRequest({
      client,
      user,
      normalizedEmail,
      normalizedCode,
    });

    return handleSuccessfulConfirmation({
      response,
      user,
      onUserUpdate,
      resetRequestState,
      onSuccess,
    });
  });
}

function confirmChangeAction({
  ensureClient,
  lastRequestedEmailRef,
  setIsVerifying,
  client,
  user,
  onUserUpdate,
  resetRequestState,
  onSuccess,
  email,
  code,
}) {
  ensureClient();
  const { normalizedEmail, normalizedCode } = validateEmailAndCode(email, code);
  ensureRequestedEmail({ lastRequestedEmailRef, normalizedEmail });

  return runConfirmationRequest({
    client,
    user,
    normalizedEmail,
    normalizedCode,
    setIsVerifying,
    onUserUpdate,
    resetRequestState,
    onSuccess,
  });
}

export function useEmailConfirmationFlow({
  client,
  ensureClient,
  user,
  onUserUpdate,
  requestState,
  onSuccess,
}) {
  const { lastRequestedEmailRef, resetRequestState } = requestState;
  const [isVerifying, setIsVerifying] = useState(false);
  const confirmChange = ({ email, code }) =>
    confirmChangeAction({
      ensureClient,
      lastRequestedEmailRef,
      setIsVerifying,
      client,
      user,
      onUserUpdate,
      resetRequestState,
      onSuccess,
      email,
      code,
    });

  return { confirmChange, isVerifying };
}
