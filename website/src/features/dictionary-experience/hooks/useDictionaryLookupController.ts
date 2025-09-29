import { useCallback, useEffect, useRef } from "react";

export function useDictionaryLookupController() {
  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const cancelActiveLookup = useCallback(() => {
    if (!abortRef.current) {
      return;
    }
    abortRef.current.abort();
    abortRef.current = null;
  }, []);

  const clearActiveLookup = useCallback(() => {
    abortRef.current = null;
  }, []);

  const beginLookup = useCallback(() => {
    cancelActiveLookup();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller;
  }, [cancelActiveLookup]);

  const isMounted = useCallback(() => isMountedRef.current, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelActiveLookup();
    };
  }, [cancelActiveLookup]);

  return {
    beginLookup,
    cancelActiveLookup,
    clearActiveLookup,
    isMounted,
  };
}
