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

const sanitizeAndSyncAccount = (account, setAccount) => {
  const sanitizedAccount = sanitizeAccountValue(account);

  if (shouldSyncSanitizedAccount(account, sanitizedAccount)) {
    setAccount(sanitizedAccount);
  }

  return sanitizedAccount;
};

const rejectInvalidAccount = (showPopup, t) => {
  showPopup(getInvalidAccountMessage(t));
  return false;
};

const rejectUnavailableMethod = (showPopup, t) => {
  showPopup(getUnavailableCodeMessage(t));
  return false;
};

const executeCodeRequest = async ({
  method,
  onRequestCode,
  sanitizedAccount,
  showPopup,
  showToast,
  t,
}) => {
  resetFeedbackChannels(showPopup, showToast);

  try {
    await onRequestCode({ account: sanitizedAccount, method });
    showToast(getCodeRequestSuccessMessage(t));
    return true;
  } catch (error) {
    showPopup(getCodeRequestErrorMessage(error, t));
    return false;
  }
};

const handleCodeRequest = async ({
  account,
  method,
  onRequestCode,
  setAccount,
  showPopup,
  showToast,
  t,
  validateAccount,
}) => {
  const sanitizedAccount = sanitizeAndSyncAccount(account, setAccount);

  if (!isAccountValid(sanitizedAccount, method, validateAccount)) {
    return rejectInvalidAccount(showPopup, t);
  }

  if (typeof onRequestCode !== "function") {
    return rejectUnavailableMethod(showPopup, t);
  }

  return executeCodeRequest({
    method,
    onRequestCode,
    sanitizedAccount,
    showPopup,
    showToast,
    t,
  });
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
  useCallback(() => {
    return handleCodeRequest({
      account,
      method,
      onRequestCode,
      setAccount,
      showPopup,
      showToast,
      t,
      validateAccount,
    });
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

const getFormStateBindings = ({
  account,
  availableFormMethods,
  handleSendCode,
  handleSubmit,
  icons,
  method,
  orderedMethods,
  otherOptionsLabel,
  password,
  passwordPlaceholder,
  placeholders,
}) => ({
  account,
  availableFormMethods,
  handleSendCode,
  handleSubmit,
  icons,
  method,
  orderedMethods,
  otherOptionsLabel,
  password,
  passwordPlaceholder,
  placeholders,
});

const getHandlerBindings = ({
  onUnavailableMethod,
  setAccount,
  setMethod,
  setPassword,
  showCodeButton,
  toastDismissLabel,
}) => ({
  onMethodChange: setMethod,
  onUnavailableMethod,
  setAccount,
  setPassword,
  showCodeButton,
  toastDismissLabel,
});

const buildBaseControllerProps = (props) => ({
  ...getFormStateBindings(props),
  ...getHandlerBindings(props),
});

const getFeedbackBindings = ({ popup, resetPopup, resetToast, toast }) => ({
  popup,
  resetPopup,
  resetToast,
  toast,
});

const composeControllerModel = (controllerProps) => ({
  ...buildBaseControllerProps(controllerProps),
  ...getFeedbackBindings(controllerProps.feedback),
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
