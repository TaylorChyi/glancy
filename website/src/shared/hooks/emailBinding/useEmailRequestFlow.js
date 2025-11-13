import { useCallback, useRef, useState } from "react";
import {
  ERROR_EMAIL_REQUIRED,
  ERROR_EMAIL_UNCHANGED,
  normalizeEmail,
} from "./constants.js";

export function useEmailRequestFlow({ client, ensureClient, user }) {
  const lastRequestedEmailRef = useRef(null);
  const [lastRequestedEmail, setLastRequestedEmail] = useState(null);
  const [codeIssuedAt, setCodeIssuedAt] = useState(null);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const resetRequestState = useCallback(() => {
    setCodeIssuedAt(null);
    lastRequestedEmailRef.current = null;
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
        const issuedAt = Date.now();
        setCodeIssuedAt(issuedAt);
        lastRequestedEmailRef.current = normalized;
        setLastRequestedEmail(normalized);
        return true;
      } finally {
        setIsSendingCode(false);
      }
    },
    [client, ensureClient, user?.email, user?.id, user?.token],
  );

  return {
    requestCode,
    isSendingCode,
    codeIssuedAt,
    lastRequestedEmail,
    lastRequestedEmailRef,
    resetRequestState,
  };
}
