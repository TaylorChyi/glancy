import { useCallback, useMemo, useState } from "react";

const DEFAULT_DURATION = 3000;

const INITIAL_STATE = Object.freeze({
  open: false,
  message: "",
  duration: DEFAULT_DURATION,
  backgroundColor: undefined,
  textColor: undefined,
  closeLabel: undefined,
});

const resolveDuration = (candidate, fallback) => {
  if (typeof candidate !== "number") return fallback;
  if (!Number.isFinite(candidate)) return fallback;
  if (candidate <= 0) return fallback;
  return candidate;
};

export function useDictionaryToast({
  defaultDuration = DEFAULT_DURATION,
} = {}) {
  const [state, setState] = useState(INITIAL_STATE);

  const showToast = useCallback(
    (message, options = {}) => {
      if (!message) {
        return;
      }
      setState({
        open: true,
        message,
        duration: resolveDuration(options.duration, defaultDuration),
        backgroundColor: options.backgroundColor,
        textColor: options.textColor,
        closeLabel: options.closeLabel,
      });
    },
    [defaultDuration],
  );

  const closeToast = useCallback(() => {
    setState((current) => ({ ...current, open: false }));
  }, []);

  const toastState = useMemo(
    () => ({
      open: state.open,
      message: state.message,
      duration: state.duration,
      backgroundColor: state.backgroundColor,
      textColor: state.textColor,
      closeLabel: state.closeLabel,
    }),
    [state],
  );

  return { state: toastState, showToast, closeToast };
}
