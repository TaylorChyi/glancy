import { useCallback } from "react";
import { sanitizeAccount } from "./authFormPrimitives.js";

const sanitizeAccountValue = (account) => sanitizeAccount(account);

const shouldSyncSanitizedAccount = (account, sanitizedAccount) =>
  sanitizedAccount !== account;

const isAccountValid = (account, method, validateAccount) =>
  typeof validateAccount === "function" && validateAccount(account, method);

const getInvalidAccountMessage = (t) => t.invalidAccount || "Invalid account";

const getUnavailableCodeMessage = (t) =>
  t.codeRequestInvalidMethod ||
  t.notImplementedYet ||
  "Verification code request is unavailable";

const getCodeRequestSuccessMessage = (t) =>
  t.codeRequestSuccess ||
  "Verification code sent. Please check your inbox.";

const getCodeRequestErrorMessage = (error, t) =>
  (typeof error?.message === "string" && error.message.trim()) ||
  t.codeRequestFailed ||
  "Failed to send verification code";

const getSubmitErrorMessage = (error, t) =>
  (typeof error?.message === "string" && error.message.trim()) ||
  t.genericRequestFailed ||
  "Request failed";

const resetFeedbackChannels = (showPopup, showToast) => {
  showPopup("");
  if (typeof showToast === "function") {
    showToast("");
  }
};

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
    const sanitizedAccount = sanitizeAccountValue(account);

    if (shouldSyncSanitizedAccount(account, sanitizedAccount)) {
      setAccount(sanitizedAccount);
    }

    if (!isAccountValid(sanitizedAccount, method, validateAccount)) {
      showPopup(getInvalidAccountMessage(t));
      return false;
    }

    if (typeof onRequestCode !== "function") {
      showPopup(getUnavailableCodeMessage(t));
      return false;
    }

    resetFeedbackChannels(showPopup, showToast);

    try {
      await onRequestCode({ account: sanitizedAccount, method });
      showToast(getCodeRequestSuccessMessage(t));
      return true;
    } catch (error) {
      showPopup(getCodeRequestErrorMessage(error, t));
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
      if (!isAccountValid(account, method, validateAccount)) {
        showPopup(getInvalidAccountMessage(t));
        return;
      }
      try {
        await onSubmit({ account, password, method });
      } catch (error) {
        showPopup(getSubmitErrorMessage(error, t));
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
  getCodeRequestErrorMessage,
  getCodeRequestSuccessMessage,
  getInvalidAccountMessage,
  getSubmitErrorMessage,
  getUnavailableCodeMessage,
  isAccountValid,
  resetFeedbackChannels,
  sanitizeAccountValue,
  shouldSyncSanitizedAccount,
  useCodeRequestHandler,
  useSubmitHandler,
  useUnavailableMethodHandler,
};
