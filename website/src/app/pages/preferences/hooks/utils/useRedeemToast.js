import { useCallback, useMemo, useState } from "react";

import {
  composeRedeemFailureMessage,
  REDEEM_TOAST_DURATION,
  REDEEM_TOAST_VARIANTS,
} from "./redeemFeedback.js";

const createToastConfig = (state, dismissLabel, handleClose) => {
  const appearance =
    (state.variant && REDEEM_TOAST_VARIANTS[state.variant]) ||
    REDEEM_TOAST_VARIANTS.success;

  return {
    ...appearance,
    ...state,
    duration: REDEEM_TOAST_DURATION,
    closeLabel: dismissLabel,
    onClose: handleClose,
  };
};

export const useRedeemToast = ({ success, failure, dismiss }) => {
  const [redeemToastState, setRedeemToastState] = useState({
    open: false,
    message: "",
    variant: "success",
  });

  const handleRedeemToastClose = useCallback(() => {
    setRedeemToastState((current) =>
      current.open ? { ...current, open: false } : current,
    );
  }, []);

  const redeemToast = useMemo(
    () => createToastConfig(redeemToastState, dismiss, handleRedeemToastClose),
    [dismiss, handleRedeemToastClose, redeemToastState],
  );

  const showSuccessToast = useCallback(() => {
    setRedeemToastState({
      open: true,
      message: success,
      variant: "success",
    });
  }, [success]);

  const showFailureToast = useCallback(
    (error) => {
      setRedeemToastState({
        open: true,
        message: composeRedeemFailureMessage(error, failure),
        variant: "failure",
      });
      return error;
    },
    [failure],
  );

  return { redeemToast, showSuccessToast, showFailureToast };
};
