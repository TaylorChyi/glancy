import {
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
} from "react";

const abortLookup = (abortRef: MutableRefObject<AbortController | null>) => {
  if (!abortRef.current) return;
  abortRef.current.abort();
  abortRef.current = null;
};

const createLookupController = (
  abortRef: MutableRefObject<AbortController | null>,
  cancelActiveLookup: () => void,
) => {
  cancelActiveLookup();
  const controller = new AbortController();
  abortRef.current = controller;
  return controller;
};

const useLookupLifecycle = (
  isMountedRef: MutableRefObject<boolean>,
  cancelActiveLookup: () => void,
) => {
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelActiveLookup();
    };
  }, [cancelActiveLookup, isMountedRef]);
};

const useMountedChecker = (isMountedRef: MutableRefObject<boolean>) =>
  useCallback(() => isMountedRef.current, [isMountedRef]);

export function useDictionaryLookupController() {
  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const cancelActiveLookup = useCallback(() => abortLookup(abortRef), []);
  const clearActiveLookup = useCallback(() => {
    abortRef.current = null;
  }, []);
  const beginLookup = useCallback(
    () => createLookupController(abortRef, cancelActiveLookup),
    [cancelActiveLookup],
  );
  const isMounted = useMountedChecker(isMountedRef);
  useLookupLifecycle(isMountedRef, cancelActiveLookup);

  return {
    beginLookup,
    cancelActiveLookup,
    clearActiveLookup,
    isMounted,
  };
}
