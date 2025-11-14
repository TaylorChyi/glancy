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

const useFormState = ({ formMethods, methodOrder, defaultMethod }) => {
  const { availableFormMethods, orderedMethods, method, setMethod } =
    useAuthMethodResolution({ formMethods, methodOrder, defaultMethod });
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  return {
    account,
    availableFormMethods,
    method,
    orderedMethods,
    password,
    setAccount,
    setMethod,
    setPassword,
  };
};

const useFormFeedbackData = ({ otherOptionsLabel, t }) => {
  const { feedback, onUnavailableMethod } = useAuthFeedback(t);
  const toastDismissLabel = useAuthToastLabel(t);
  const resolvedOtherOptionsLabel = useAuthOtherOptionsLabel(
    otherOptionsLabel,
    t,
  );
  return {
    feedback,
    onUnavailableMethod,
    otherOptionsLabel: resolvedOtherOptionsLabel,
    toastDismissLabel,
  };
};

function useFormHandlers({
  account,
  method,
  onRequestCode,
  onSubmit,
  password,
  validateAccount,
  feedback,
  setAccount,
  t,
}) {
  return {
    handleSendCode: useCodeRequestHandler({
      account,
      method,
      onRequestCode,
      setAccount,
      showPopup: feedback.showPopup,
      showToast: feedback.showToast,
      t,
      validateAccount,
    }),
    handleSubmit: useSubmitHandler({
      account,
      method,
      onSubmit,
      password,
      showPopup: feedback.showPopup,
      t,
      validateAccount,
    }),
  };
}

function useAuthFormController(props) {
  const {
    account,
    availableFormMethods,
    method,
    orderedMethods,
    password,
    setAccount,
    setMethod,
    setPassword,
  } = useFormState(props);
  const {
    feedback,
    onUnavailableMethod,
    otherOptionsLabel,
    toastDismissLabel,
  } = useFormFeedbackData(props);
  const { handleSendCode, handleSubmit } = useFormHandlers({
    account,
    method,
    onRequestCode: props.onRequestCode,
    onSubmit: props.onSubmit,
    password,
    validateAccount: props.validateAccount,
    feedback,
    setAccount,
    t: props.t,
  });

  return composeControllerModel({
    account,
    availableFormMethods,
    feedback,
    handleSendCode,
    handleSubmit,
    icons: props.icons,
    method,
    onUnavailableMethod,
    orderedMethods,
    otherOptionsLabel,
    password,
    passwordPlaceholder: props.passwordPlaceholder,
    placeholders: props.placeholders,
    setAccount,
    setMethod,
    setPassword,
    showCodeButton: props.showCodeButton,
    toastDismissLabel,
  });
}

export { useAuthFormController };
export { resolveInitialMethod, sanitizeAccount } from "./authFormPrimitives.js";
export { useFeedbackChannels } from "./authFormFeedback.js";
