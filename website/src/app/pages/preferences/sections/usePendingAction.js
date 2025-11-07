import { useCallback, useState } from "react";

export const usePendingAction = () => {
  const [pendingAction, setPendingAction] = useState("");

  const runWithPending = useCallback(async (actionId, task) => {
    setPendingAction(actionId);
    try {
      await task();
    } finally {
      setPendingAction("");
    }
  }, []);

  const isActionPending = useCallback(
    (actionId) => pendingAction === actionId,
    [pendingAction],
  );

  return { runWithPending, isActionPending };
};
