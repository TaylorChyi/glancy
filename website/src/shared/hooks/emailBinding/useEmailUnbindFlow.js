import { useCallback, useState } from "react";

function extractEmailFromResponse(response) {
  return response?.email ?? null;
}

function handleUserUpdate({ user, updatedEmail, onUserUpdate }) {
  if (typeof onUserUpdate === "function" && user) {
    onUserUpdate({ ...user, email: updatedEmail });
  }
}

function handleReset(resetRequestState) {
  if (typeof resetRequestState === "function") {
    resetRequestState();
  }
}

function handleSuccess(updatedEmail, onSuccess) {
  if (typeof onSuccess === "function") {
    onSuccess(updatedEmail);
  }
}

function processUnbindResult({
  response,
  user,
  onUserUpdate,
  onSuccess,
  resetRequestState,
}) {
  const updatedEmail = extractEmailFromResponse(response);
  handleUserUpdate({ user, updatedEmail, onUserUpdate });
  handleReset(resetRequestState);
  handleSuccess(updatedEmail, onSuccess);
  return updatedEmail;
}

export function useEmailUnbindFlow({
  client,
  ensureClient,
  user,
  onUserUpdate,
  onSuccess,
  resetRequestState,
}) {
  const [isUnbinding, setIsUnbinding] = useState(false);

  const unbindEmail = useCallback(async () => {
    ensureClient();
    try {
      setIsUnbinding(true);
      const response = await client.unbindEmail({
        userId: user.id,
        token: user.token,
      });
      return processUnbindResult({
        response,
        user,
        onUserUpdate,
        onSuccess,
        resetRequestState,
      });
    } finally {
      setIsUnbinding(false);
    }
  }, [client, ensureClient, onSuccess, onUserUpdate, resetRequestState, user]);

  return { unbindEmail, isUnbinding };
}
