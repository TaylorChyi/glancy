/**
 * 背景：
 *  - 控制器模块需要对请求与可用性逻辑解耦，方便按需替换或扩展。
 * 目的：
 *  - 收拢 AuthForm 的副作用处理与视图模型装配逻辑，保持 Hook 主体聚焦于状态编排。
 * 关键决策与取舍：
 *  - 通过独立 Hook 管理请求副作用，未来可以插入节流/重试策略；
 *  - `composeControllerModel` 保持纯函数，方便测试时直接断言输出结构。
 * 影响范围：
 *  - AuthForm 控制器及相关测试。
 * 演进与TODO：
 *  - 可引入责任链模式以应对更多登录方式校验与错误分级处理。
 */
import { useCallback } from "react";
import { sanitizeAccount } from "./authFormPrimitives.js";

const useCodeRequestHandler = ({
  account,
  method,
  onRequestCode,
  setAccount,
  showPopup,
  showToast,
  t,
  validateAccount,
}) =>
  useCallback(async () => {
    const sanitizedAccount = sanitizeAccount(account);

    if (sanitizedAccount !== account) {
      setAccount(sanitizedAccount);
    }

    if (!validateAccount(sanitizedAccount, method)) {
      showPopup(t.invalidAccount || "Invalid account");
      return false;
    }

    if (typeof onRequestCode !== "function") {
      const fallbackMessage =
        t.codeRequestInvalidMethod ||
        t.notImplementedYet ||
        "Verification code request is unavailable";
      showPopup(fallbackMessage);
      return false;
    }

    showPopup("");
    showToast("");

    try {
      await onRequestCode({ account: sanitizedAccount, method });
      const successMessage =
        t.codeRequestSuccess ||
        "Verification code sent. Please check your inbox.";
      showToast(successMessage);
      return true;
    } catch (err) {
      const errorMessage =
        (typeof err?.message === "string" && err.message.trim()) ||
        t.codeRequestFailed ||
        "Failed to send verification code";
      showPopup(errorMessage);
      return false;
    }
  }, [
    account,
    method,
    onRequestCode,
    setAccount,
    showPopup,
    showToast,
    t,
    validateAccount,
  ]);

const useSubmitHandler = ({
  account,
  method,
  onSubmit,
  password,
  showPopup,
  t,
  validateAccount,
}) =>
  useCallback(
    async (event) => {
      event.preventDefault();
      showPopup("");
      if (!validateAccount(account, method)) {
        showPopup(t.invalidAccount || "Invalid account");
        return;
      }
      try {
        await onSubmit({ account, password, method });
      } catch (err) {
        const fallbackMessage =
          (typeof err?.message === "string" && err.message.trim()) ||
          t.genericRequestFailed ||
          "Request failed";
        showPopup(fallbackMessage);
      }
    },
    [account, method, onSubmit, password, showPopup, t, validateAccount],
  );

const useUnavailableMethodHandler = (showPopup, t) =>
  useCallback(
    () => showPopup(t.notImplementedYet || "Not implemented yet"),
    [showPopup, t],
  );

const composeControllerModel = ({
  account,
  availableFormMethods,
  feedback,
  handleSendCode,
  handleSubmit,
  icons,
  method,
  onUnavailableMethod,
  orderedMethods,
  otherOptionsLabel,
  password,
  passwordPlaceholder,
  placeholders,
  setAccount,
  setMethod,
  setPassword,
  showCodeButton,
  toastDismissLabel,
}) => ({
  account,
  availableFormMethods,
  handleSendCode,
  handleSubmit,
  icons,
  method,
  onMethodChange: setMethod,
  onUnavailableMethod,
  orderedMethods,
  otherOptionsLabel,
  password,
  passwordPlaceholder,
  placeholders,
  popup: feedback.popup,
  resetPopup: feedback.resetPopup,
  resetToast: feedback.resetToast,
  setAccount,
  setPassword,
  showCodeButton,
  toast: feedback.toast,
  toastDismissLabel,
});

export {
  composeControllerModel,
  useCodeRequestHandler,
  useSubmitHandler,
  useUnavailableMethodHandler,
};
