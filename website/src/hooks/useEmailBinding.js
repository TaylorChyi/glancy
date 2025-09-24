import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi.js";

const MODE_IDLE = "idle";
const MODE_EDITING = "editing";

const ERROR_EMAIL_REQUIRED = "email-binding-email-required";
const ERROR_EMAIL_UNCHANGED = "email-binding-email-unchanged";
const ERROR_CODE_REQUIRED = "email-binding-code-required";
const ERROR_MISSING_REQUEST = "email-binding-code-missing-request";
const ERROR_EMAIL_MISMATCH = "email-binding-email-mismatch";

const normalizeEmail = (email) => email?.trim().toLowerCase() ?? "";

export function useEmailBinding({ user, onUserUpdate, apiClient } = {}) {
  const api = useApi();
  const client = useMemo(
    () => apiClient ?? api?.users ?? null,
    [apiClient, api],
  );

  const [mode, setMode] = useState(MODE_IDLE);
  const [codeIssuedAt, setCodeIssuedAt] = useState(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnbinding, setIsUnbinding] = useState(false);
  const [lastRequestedEmail, setLastRequestedEmail] = useState(null);

  useEffect(() => {
    setMode(MODE_IDLE);
    setCodeIssuedAt(null);
    setLastRequestedEmail(null);
  }, [user?.email]);

  const ensureClient = useCallback(() => {
    if (!client) {
      throw new Error("email-binding-client-missing");
    }
    if (!user?.id || !user?.token) {
      const error = new Error("email-binding-user-missing");
      error.code = "email-binding-user-missing";
      throw error;
    }
  }, [client, user?.id, user?.token]);

  const startEditing = useCallback(() => {
    setMode(MODE_EDITING);
  }, []);

  const cancelEditing = useCallback(() => {
    setMode(MODE_IDLE);
    setCodeIssuedAt(null);
    setLastRequestedEmail(null);
  }, []);

  const requestCode = useCallback(
    async (nextEmail) => {
      ensureClient();
      const normalized = normalizeEmail(nextEmail);
      if (!normalized) {
        const error = new Error(ERROR_EMAIL_REQUIRED);
        error.code = ERROR_EMAIL_REQUIRED;
        throw error;
      }

      const currentEmail = normalizeEmail(user?.email);
      if (currentEmail && currentEmail === normalized) {
        const error = new Error(ERROR_EMAIL_UNCHANGED);
        error.code = ERROR_EMAIL_UNCHANGED;
        throw error;
      }

      try {
        setIsSendingCode(true);
        await client.requestEmailChangeCode({
          userId: user.id,
          email: normalized,
          token: user.token,
        });
        setCodeIssuedAt(Date.now());
        setLastRequestedEmail(normalized);
        return true;
      } finally {
        setIsSendingCode(false);
      }
    },
    [client, ensureClient, user?.email, user?.id, user?.token],
  );

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

      if (!lastRequestedEmail) {
        const error = new Error(ERROR_MISSING_REQUEST);
        error.code = ERROR_MISSING_REQUEST;
        throw error;
      }

      if (normalizeEmail(lastRequestedEmail) !== normalizedEmail) {
        const error = new Error(ERROR_EMAIL_MISMATCH);
        error.code = ERROR_EMAIL_MISMATCH;
        error.meta = { requestedEmail: lastRequestedEmail };
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
        setMode(MODE_IDLE);
        setCodeIssuedAt(null);
        setLastRequestedEmail(null);
        return updatedEmail;
      } finally {
        setIsVerifying(false);
      }
    },
    [client, ensureClient, lastRequestedEmail, onUserUpdate, user],
  );

  const unbindEmail = useCallback(async () => {
    ensureClient();
    try {
      setIsUnbinding(true);
      const response = await client.unbindEmail({
        userId: user.id,
        token: user.token,
      });
      const updatedEmail = response?.email ?? null;
      if (typeof onUserUpdate === "function" && user) {
        onUserUpdate({ ...user, email: updatedEmail });
      }
      setMode(MODE_IDLE);
      setCodeIssuedAt(null);
      setLastRequestedEmail(null);
      return updatedEmail;
    } finally {
      setIsUnbinding(false);
    }
  }, [client, ensureClient, onUserUpdate, user]);

  return {
    mode,
    startEditing,
    cancelEditing,
    requestCode,
    confirmChange,
    unbindEmail,
    isSendingCode,
    isVerifying,
    isUnbinding,
    codeIssuedAt,
    lastRequestedEmail,
    requestedEmail: lastRequestedEmail,
    isAwaitingVerification: Boolean(lastRequestedEmail && codeIssuedAt),
    hasBoundEmail: Boolean(user?.email),
  };
}

export default useEmailBinding;
