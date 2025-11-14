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

function useEmailBindingMode({ resetRequestFlowState, userEmail }) {
  const [mode, setMode] = useState(MODE_IDLE);

  const resetBindingState = useCallback(() => {
    setMode(MODE_IDLE);
    resetRequestFlowState();
  }, [resetRequestFlowState]);

  useEffect(() => {
    resetBindingState();
  }, [resetBindingState, userEmail]);

  const startEditing = useCallback(() => {
    setMode(MODE_EDITING);
  }, []);

  return {
    mode,
    startEditing,
    cancelEditing: resetBindingState,
    resetBindingState,
  };
}

function useEmailBindingRequestState({ client, ensureClient, user }) {
  const requestState = useEmailRequestFlow({ client, ensureClient, user });
  const modeState = useEmailBindingMode({
    resetRequestFlowState: requestState.resetRequestState,
    userEmail: user?.email,
  });

  return {
    ...modeState,
    requestCode: requestState.requestCode,
    isSendingCode: requestState.isSendingCode,
    codeIssuedAt: requestState.codeIssuedAt,
    lastRequestedEmail: requestState.lastRequestedEmail,
    lastRequestedEmailRef: requestState.lastRequestedEmailRef,
    resetRequestState: requestState.resetRequestState,
  };
}

function useEmailBindingFlowHandlers(options) {
  const {
    client,
    ensureClient,
    user,
    onUserUpdate,
    requestState,
    resetBindingState,
  } = options;
  const sharedFlowProps = { client, ensureClient, user, onUserUpdate };
  const { lastRequestedEmailRef, resetRequestState } = requestState;
  const confirmation = useEmailConfirmationFlow({
    ...sharedFlowProps,
    requestState: { lastRequestedEmailRef, resetRequestState },
    onSuccess: resetBindingState,
  });
  const unbind = useEmailUnbindFlow({
    ...sharedFlowProps,
    onSuccess: resetBindingState,
    resetRequestState,
  });
  return {
    confirmChange: confirmation.confirmChange,
    isVerifying: confirmation.isVerifying,
    unbindEmail: unbind.unbindEmail,
    isUnbinding: unbind.isUnbinding,
  };
}

function useEmailBindingState({ client, ensureClient, user, onUserUpdate }) {
  const requestState = useEmailBindingRequestState({ client, ensureClient, user });

  const flowHandlers = useEmailBindingFlowHandlers({
    client,
    ensureClient,
    user,
    onUserUpdate,
    requestState,
    resetBindingState: requestState.resetBindingState,
  });

  return {
    mode: requestState.mode,
    startEditing: requestState.startEditing,
    cancelEditing: requestState.cancelEditing,
    requestCode: requestState.requestCode,
    isSendingCode: requestState.isSendingCode,
    codeIssuedAt: requestState.codeIssuedAt,
    lastRequestedEmail: requestState.lastRequestedEmail,
    ...flowHandlers,
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
