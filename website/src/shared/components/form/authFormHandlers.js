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
