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

const buildToastPayload = ({ message, options, defaultDuration }) => ({
  open: true,
  message,
  duration: resolveDuration(options.duration, defaultDuration),
  backgroundColor: options.backgroundColor,
  textColor: options.textColor,
  closeLabel: options.closeLabel,
});

const selectToastState = (state) => ({
  open: state.open,
  message: state.message,
  duration: state.duration,
  backgroundColor: state.backgroundColor,
  textColor: state.textColor,
  closeLabel: state.closeLabel,
});

const dismissToastState = (current) => ({ ...current, open: false });

const useToastStateSelector = (state) =>
  useMemo(() => selectToastState(state), [state]);

const useToastPresenter = (setState, defaultDuration) =>
  useCallback(
    (message, options = {}) => {
      if (!message) return;
      setState(buildToastPayload({ message, options, defaultDuration }));
    },
    [setState, defaultDuration],
  );

const useToastCloser = (setState) =>
  useCallback(() => {
    setState((current) => dismissToastState(current));
  }, [setState]);

export function useDictionaryToast({
  defaultDuration = DEFAULT_DURATION,
} = {}) {
  const [state, setState] = useState(INITIAL_STATE);
  const showToast = useToastPresenter(setState, defaultDuration);
  const closeToast = useToastCloser(setState);
  const toastState = useToastStateSelector(state);
  return { state: toastState, showToast, closeToast };
}
