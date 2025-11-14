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

const createHandlerConfig = ({ account, method, t, validateAccount }) => ({
  account,
  method,
  t,
  validateAccount,
});

const createSendCodeConfig = (handlerConfig, extras) => ({
  ...handlerConfig,
  onRequestCode: extras.onRequestCode,
  setAccount: extras.setAccount,
  showPopup: extras.feedback.showPopup,
  showToast: extras.feedback.showToast,
});

const createSubmitConfig = (handlerConfig, extras) => ({
  ...handlerConfig,
  onSubmit: extras.onSubmit,
  password: extras.password,
  showPopup: extras.feedback.showPopup,
});

function useFormHandlers(handlerArgs) {
  const handlerConfig = createHandlerConfig(handlerArgs);

  return {
    handleSendCode: useCodeRequestHandler(
      createSendCodeConfig(handlerConfig, handlerArgs),
    ),
    handleSubmit: useSubmitHandler(
      createSubmitConfig(handlerConfig, handlerArgs),
    ),
  };
}

const buildControllerModel = ({
  feedbackData,
  formState,
  handlers,
  props,
}) =>
  composeControllerModel({
    ...formState,
    feedback: feedbackData.feedback,
    handleSendCode: handlers.handleSendCode,
    handleSubmit: handlers.handleSubmit,
    icons: props.icons,
    onUnavailableMethod: feedbackData.onUnavailableMethod,
    otherOptionsLabel: feedbackData.otherOptionsLabel,
    passwordPlaceholder: props.passwordPlaceholder,
    placeholders: props.placeholders,
    showCodeButton: props.showCodeButton,
    toastDismissLabel: feedbackData.toastDismissLabel,
  });

function useAuthFormController(props) {
  const formState = useFormState(props);
  const feedbackData = useFormFeedbackData(props);
  const handlers = useFormHandlers({
    ...formState,
    feedback: feedbackData.feedback,
    onRequestCode: props.onRequestCode,
    onSubmit: props.onSubmit,
    validateAccount: props.validateAccount,
    t: props.t,
  });

  return buildControllerModel({
    feedbackData,
    formState,
    handlers,
    props,
  });
}

export { useAuthFormController };
export { resolveInitialMethod, sanitizeAccount } from "./authFormPrimitives.js";
export { useFeedbackChannels } from "./authFormFeedback.js";
