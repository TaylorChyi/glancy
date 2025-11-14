import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@shared/hooks/useApi.js";
import {
  MODE_EDITING,
  MODE_IDLE,
  normalizeEmail,
} from "./emailBinding/constants.js";
import { useEmailRequestFlow } from "./emailBinding/useEmailRequestFlow.js";
import { useEmailConfirmationFlow } from "./emailBinding/useEmailConfirmationFlow.js";
import { useEmailUnbindFlow } from "./emailBinding/useEmailUnbindFlow.js";

function useEmailBindingClient({ user, apiClient }) {
  const api = useApi();
  const client = useMemo(
    () => apiClient ?? api?.users ?? null,
    [apiClient, api],
  );

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

  return { client, ensureClient };
}

function useEmailBindingState({ client, ensureClient, user, onUserUpdate }) {
  const [mode, setMode] = useState(MODE_IDLE);

  const {
    requestCode,
    isSendingCode,
    codeIssuedAt,
    lastRequestedEmail,
    lastRequestedEmailRef,
    resetRequestState,
  } = useEmailRequestFlow({ client, ensureClient, user });

  const resetBindingState = useCallback(() => {
    setMode(MODE_IDLE);
    resetRequestState();
  }, [resetRequestState]);

  useEffect(() => {
    resetBindingState();
  }, [resetBindingState, user?.email]);

  const startEditing = useCallback(() => {
    setMode(MODE_EDITING);
  }, []);

  const cancelEditing = useCallback(() => {
    resetBindingState();
  }, [resetBindingState]);

  const { confirmChange, isVerifying } = useEmailConfirmationFlow({
    client,
    ensureClient,
    user,
    onUserUpdate,
    requestState: { lastRequestedEmailRef, resetRequestState },
    onSuccess: resetBindingState,
  });

  const { unbindEmail, isUnbinding } = useEmailUnbindFlow({
    client,
    ensureClient,
    user,
    onUserUpdate,
    onSuccess: resetBindingState,
    resetRequestState,
  });

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
  };
}

export function useEmailBinding({ user, onUserUpdate, apiClient } = {}) {
  const { client, ensureClient } = useEmailBindingClient({ user, apiClient });
  const state = useEmailBindingState({ client, ensureClient, user, onUserUpdate });
  const { lastRequestedEmail, codeIssuedAt } = state;

  return {
    ...state,
    requestedEmail: lastRequestedEmail,
    isAwaitingVerification: Boolean(lastRequestedEmail && codeIssuedAt),
    hasBoundEmail: Boolean(normalizeEmail(user?.email)),
  };
}

export default useEmailBinding;
