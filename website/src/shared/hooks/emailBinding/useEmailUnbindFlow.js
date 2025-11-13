import { useCallback, useState } from "react";

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
      const updatedEmail = response?.email ?? null;
      if (typeof onUserUpdate === "function" && user) {
        onUserUpdate({ ...user, email: updatedEmail });
      }
      if (typeof resetRequestState === "function") {
        resetRequestState();
      }
      if (typeof onSuccess === "function") {
        onSuccess(updatedEmail);
      }
      return updatedEmail;
    } finally {
      setIsUnbinding(false);
    }
  }, [client, ensureClient, onSuccess, onUserUpdate, resetRequestState, user]);

  return { unbindEmail, isUnbinding };
}
