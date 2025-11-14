import { useCallback, useMemo, useState } from "react";

import {
  composeRedeemFailureMessage,
  REDEEM_TOAST_DURATION,
  REDEEM_TOAST_VARIANTS,
} from "./redeemFeedback.js";

const resolveToastAppearance = (variant) =>
  (variant && REDEEM_TOAST_VARIANTS[variant]) || REDEEM_TOAST_VARIANTS.success;

const createToastConfig = (state, dismissLabel, handleClose) => ({
  ...resolveToastAppearance(state.variant),
  ...state,
  duration: REDEEM_TOAST_DURATION,
  closeLabel: dismissLabel,
  onClose: handleClose,
});

const useRedeemToastState = () => {
  const [state, setState] = useState({
    open: false,
    message: "",
    variant: "success",
  });

  const handleClose = useCallback(() => {
    setState((current) =>
      current.open ? { ...current, open: false } : current,
    );
  }, []);

  return { state, setState, handleClose };
};

const useRedeemToastConfig = (state, dismissLabel, handleClose) =>
  useMemo(
    () => createToastConfig(state, dismissLabel, handleClose),
    [dismissLabel, handleClose, state],
  );

const useRedeemSuccessHandler = (setState, message) =>
  useCallback(() => {
    setState({
      open: true,
      message,
      variant: "success",
    });
  }, [message, setState]);

const useRedeemFailureHandler = (setState, fallbackMessage) =>
  useCallback(
    (error) => {
      setState({
        open: true,
        message: composeRedeemFailureMessage(error, fallbackMessage),
        variant: "failure",
      });
      return error;
    },
    [fallbackMessage, setState],
  );

export const useRedeemToast = ({ success, failure, dismiss }) => {
  const { state, setState, handleClose } = useRedeemToastState();
  const redeemToast = useRedeemToastConfig(state, dismiss, handleClose);
  const showSuccessToast = useRedeemSuccessHandler(setState, success);
  const showFailureToast = useRedeemFailureHandler(setState, failure);

  return { redeemToast, showSuccessToast, showFailureToast };
};
