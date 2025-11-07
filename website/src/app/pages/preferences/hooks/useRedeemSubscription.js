import { useCallback, useMemo, useState } from "react";
import { pickFirstMeaningfulString } from "./utils/displayValues.js";
import {
  composeRedeemFailureMessage,
  DEFAULT_REDEEM_FAILURE_MESSAGE,
  DEFAULT_REDEEM_SUCCESS_MESSAGE,
  DEFAULT_TOAST_DISMISS_LABEL,
  REDEEM_TOAST_DURATION,
  REDEEM_TOAST_VARIANTS,
} from "./utils/redeemFeedback.js";
import {
  MEMBERSHIP_EFFECT_TYPE,
  mergeMembershipRewardIntoUser,
} from "./utils/membershipAdapter.js";

const createRedeemCopy = (translations) => ({
  success: pickFirstMeaningfulString(
    [translations.subscriptionRedeemSuccessToast],
    DEFAULT_REDEEM_SUCCESS_MESSAGE,
  ),
  failure: pickFirstMeaningfulString(
    [translations.subscriptionRedeemFailureToast],
    DEFAULT_REDEEM_FAILURE_MESSAGE,
  ),
  dismiss: pickFirstMeaningfulString(
    [translations.toastDismissLabel],
    DEFAULT_TOAST_DISMISS_LABEL,
  ),
});

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

const ensureRedeemPreconditions = ({
  user,
  redeemCodeRequest,
  emitFailure,
}) => {
  if (!user?.token) {
    const error = new Error("redeem-auth-missing");
    console.error("Failed to redeem subscription code", error);
    throw emitFailure(error);
  }
  if (typeof redeemCodeRequest !== "function") {
    const error = new Error("redeem-api-unavailable");
    console.error("Failed to redeem subscription code", error);
    throw emitFailure(error);
  }
};

const createRedeemExecutor =
  ({
    user,
    setUser,
    redeemCodeRequest,
    copy,
    emitRedeemFailureToast,
    setRedeemToastState,
  }) =>
  async (normalizedCode) => {
    ensureRedeemPreconditions({
      user,
      redeemCodeRequest,
      emitFailure: emitRedeemFailureToast,
    });

    try {
      const response = await redeemCodeRequest({
        token: user.token,
        code: normalizedCode,
      });

      if (
        response?.effectType === MEMBERSHIP_EFFECT_TYPE &&
        response?.membership &&
        typeof setUser === "function"
      ) {
        const nextUser = mergeMembershipRewardIntoUser(
          user,
          response.membership,
        );
        setUser(nextUser);
      }

      setRedeemToastState({
        open: true,
        message: copy.success,
        variant: "success",
      });

      return response;
    } catch (error) {
      console.error("Failed to redeem subscription code", error);
      emitRedeemFailureToast(error);
      throw error;
    }
  };

export const useRedeemSubscription = ({
  translations,
  user,
  setUser,
  redeemCodeRequest,
}) => {
  const copy = useMemo(() => createRedeemCopy(translations), [translations]);

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
    () =>
      createToastConfig(redeemToastState, copy.dismiss, handleRedeemToastClose),
    [copy.dismiss, handleRedeemToastClose, redeemToastState],
  );

  const emitRedeemFailureToast = useCallback(
    (error) => {
      setRedeemToastState({
        open: true,
        message: composeRedeemFailureMessage(error, copy.failure),
        variant: "failure",
      });
      return error;
    },
    [copy.failure],
  );

  const handleRedeem = useCallback(
    async (rawCode) => {
      const normalizedCode = typeof rawCode === "string" ? rawCode.trim() : "";
      if (!normalizedCode) {
        return undefined;
      }
      const executeRedeem = createRedeemExecutor({
        user,
        setUser,
        redeemCodeRequest,
        copy,
        emitRedeemFailureToast,
        setRedeemToastState,
      });
      return executeRedeem(normalizedCode);
    },
    [copy, emitRedeemFailureToast, redeemCodeRequest, setUser, user],
  );

  return { redeemToast, handleRedeem };
};
