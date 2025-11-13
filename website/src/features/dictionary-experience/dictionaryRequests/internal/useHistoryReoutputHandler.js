import { useCallback } from "react";

export const useHistoryReoutputHandler = ({ currentTerm, loadEntry }) =>
  useCallback(() => {
    if (!currentTerm) return;
    loadEntry(currentTerm, { forceNew: true });
  }, [currentTerm, loadEntry]);

export default useHistoryReoutputHandler;
