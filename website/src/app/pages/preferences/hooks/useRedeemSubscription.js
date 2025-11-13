import { useCallback, useMemo } from "react";

import { pickFirstMeaningfulString } from "./utils/displayValues.js";
import {
  DEFAULT_REDEEM_FAILURE_MESSAGE,
  DEFAULT_REDEEM_SUCCESS_MESSAGE,
  DEFAULT_TOAST_DISMISS_LABEL,
} from "./utils/redeemFeedback.js";
import { useRedeemToast } from "./utils/useRedeemToast.js";
import { useRedeemExecutor } from "./utils/useRedeemExecutor.js";

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

export const useRedeemSubscription = ({
  translations,
  user,
  setUser,
  redeemCodeRequest,
}) => {
  const copy = useMemo(() => createRedeemCopy(translations), [translations]);

  const { redeemToast, showFailureToast, showSuccessToast } = useRedeemToast(copy);

  const executeRedeem = useRedeemExecutor({
    user,
    setUser,
    redeemCodeRequest,
    onSuccess: showSuccessToast,
    onFailure: showFailureToast,
  });

  const handleRedeem = useCallback(
    (rawCode) => {
      const normalizedCode = typeof rawCode === "string" ? rawCode.trim() : "";
      if (!normalizedCode) {
        return undefined;
      }
      return executeRedeem(normalizedCode);
    },
    [executeRedeem],
  );

  return { redeemToast, handleRedeem };
};
