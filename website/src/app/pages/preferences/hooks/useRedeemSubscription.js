/**
 * 背景：
 *  - 订阅兑换流程原本与主 Hook 紧密耦合，导致 usePreferenceSections.js 过长且难以复用。
 * 目的：
 *  - 将兑换相关状态管理（toast、接口调用、用户上下文同步）抽离为独立 Hook，
 *    便于页面与模态共同消费，同时为后续扩展灰度实验保留注入点。
 * 关键决策与取舍：
 *  - 采用命令式 handleRedeem API，与 UI 解耦，可被按钮或快捷键触发；
 *  - 将提示语生成与视觉常量集中到 utils 中，保持单一职责。
 * 影响范围：
 *  - 偏好设置页面订阅分区；未来若引入移动端偏好设置亦可直接复用。
 * 演进与TODO：
 *  - 可在此注入特性开关或埋点回调，支持运营活动监控。
 */
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

const ensureRedeemPreconditions = ({ user, redeemCodeRequest, emitFailure }) => {
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

const createRedeemExecutor = ({
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
    () => createToastConfig(redeemToastState, copy.dismiss, handleRedeemToastClose),
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
