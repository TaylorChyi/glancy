import { useCallback } from "react";

export default function useDraftEmailHandler(setDraftEmail) {
  return useCallback(
    (event) => {
      setDraftEmail(event.target.value);
    },
    [setDraftEmail],
  );
}

export { useDraftEmailHandler };
