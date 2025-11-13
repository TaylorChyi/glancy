import { useState } from "react";
import {
  useAuthFeedback,
  useAuthMethodResolution,
  useAuthOtherOptionsLabel,
  useAuthToastLabel,
} from "./authFormControllerHooks.js";
import {
  composeControllerModel,
  useCodeRequestHandler,
  useSubmitHandler,
} from "./authFormHandlers.js";

const useAuthFormController = ({
  formMethods,
  methodOrder,
  defaultMethod,
  validateAccount,
  passwordPlaceholder,
  showCodeButton,
  icons,
  otherOptionsLabel,
  placeholders,
  onRequestCode,
  onSubmit,
  t,
}) => {
  const { availableFormMethods, orderedMethods, method, setMethod } =
    useAuthMethodResolution({ formMethods, methodOrder, defaultMethod });
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const { feedback, onUnavailableMethod } = useAuthFeedback(t);
  const toastDismissLabel = useAuthToastLabel(t);
  const resolvedOtherOptionsLabel = useAuthOtherOptionsLabel(
    otherOptionsLabel,
    t,
  );
  const handleSendCode = useCodeRequestHandler({
    account,
    method,
    onRequestCode,
    setAccount,
    showPopup: feedback.showPopup,
    showToast: feedback.showToast,
    t,
    validateAccount,
  });
  const handleSubmit = useSubmitHandler({
    account,
    method,
    onSubmit,
    password,
    showPopup: feedback.showPopup,
    t,
    validateAccount,
  });

  return composeControllerModel({
    account,
    availableFormMethods,
    feedback,
    handleSendCode,
    handleSubmit,
    icons,
    method,
    onUnavailableMethod,
    orderedMethods,
    otherOptionsLabel: resolvedOtherOptionsLabel,
    password,
    passwordPlaceholder,
    placeholders,
    setAccount,
    setMethod,
    setPassword,
    showCodeButton,
    toastDismissLabel,
  });
};

export { useAuthFormController };
export { resolveInitialMethod, sanitizeAccount } from "./authFormPrimitives.js";
export { useFeedbackChannels } from "./authFormFeedback.js";
