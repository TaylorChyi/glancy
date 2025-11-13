import { useCallback, useState } from "react";
import {
  ERROR_CODE_REQUIRED,
  ERROR_EMAIL_MISMATCH,
  ERROR_EMAIL_REQUIRED,
  ERROR_MISSING_REQUEST,
  normalizeEmail,
} from "./constants.js";

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

  const confirmChange = useCallback(
    async ({ email, code }) => {
      ensureClient();
      const normalizedEmail = normalizeEmail(email);
      const normalizedCode = code?.trim();

      if (!normalizedEmail) {
        const error = new Error(ERROR_EMAIL_REQUIRED);
        error.code = ERROR_EMAIL_REQUIRED;
        throw error;
      }

      if (!normalizedCode) {
        const error = new Error(ERROR_CODE_REQUIRED);
        error.code = ERROR_CODE_REQUIRED;
        throw error;
      }

      const requestedEmail = lastRequestedEmailRef.current;

      if (!requestedEmail) {
        const error = new Error(ERROR_MISSING_REQUEST);
        error.code = ERROR_MISSING_REQUEST;
        throw error;
      }

      if (normalizeEmail(requestedEmail) !== normalizedEmail) {
        const error = new Error(ERROR_EMAIL_MISMATCH);
        error.code = ERROR_EMAIL_MISMATCH;
        error.meta = { requestedEmail };
        throw error;
      }

      try {
        setIsVerifying(true);
        const response = await client.confirmEmailChange({
          userId: user.id,
          email: normalizedEmail,
          code: normalizedCode,
          token: user.token,
        });
        const updatedEmail = response?.email ?? null;
        if (typeof onUserUpdate === "function" && user) {
          onUserUpdate({ ...user, email: updatedEmail });
        }
        resetRequestState();
        if (typeof onSuccess === "function") {
          onSuccess(updatedEmail);
        }
        return updatedEmail;
      } finally {
        setIsVerifying(false);
      }
    },
    [
      client,
      ensureClient,
      lastRequestedEmailRef,
      onSuccess,
      onUserUpdate,
      resetRequestState,
      user,
    ],
  );

  return { confirmChange, isVerifying };
}
