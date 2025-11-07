import { useEffect, useMemo, useState } from "react";
import { resolveInitialMethod } from "./authFormPrimitives.js";
import { useFeedbackChannels } from "./authFormFeedback.js";
import {
  composeControllerModel,
  useCodeRequestHandler,
  useSubmitHandler,
  useUnavailableMethodHandler,
} from "./authFormHandlers.js";

const useAuthMethods = ({ formMethods, methodOrder, defaultMethod }) => {
  const availableFormMethods = useMemo(
    () => (Array.isArray(formMethods) ? formMethods : []),
    [formMethods],
  );
  const orderedMethods = useMemo(
    () => (Array.isArray(methodOrder) ? methodOrder : []),
    [methodOrder],
  );
  const [method, setMethod] = useState(() =>
    resolveInitialMethod(availableFormMethods, defaultMethod),
  );

  useEffect(() => {
    const preferredMethod = resolveInitialMethod(
      availableFormMethods,
      defaultMethod,
    );
    setMethod((currentMethod) => {
      if (availableFormMethods.includes(currentMethod)) {
        return currentMethod;
      }
      return preferredMethod;
    });
  }, [availableFormMethods, defaultMethod]);

  return { availableFormMethods, orderedMethods, method, setMethod };
};

const useOtherOptionsLabel = (otherOptionsLabel, t) =>
  useMemo(() => {
    const fallback = t.otherLoginOptions ?? "Other login options";
    const trimmed =
      typeof otherOptionsLabel === "string" ? otherOptionsLabel.trim() : "";
    return trimmed || fallback;
  }, [otherOptionsLabel, t]);

const useToastDismissLabel = (t) =>
  useMemo(() => t.toastDismissLabel || t.close || "Dismiss notification", [t]);

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
    useAuthMethods({ formMethods, methodOrder, defaultMethod });
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const feedback = useFeedbackChannels();
  const toastDismissLabel = useToastDismissLabel(t);
  const resolvedOtherOptionsLabel = useOtherOptionsLabel(otherOptionsLabel, t);
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
  const onUnavailableMethod = useUnavailableMethodHandler(
    feedback.showPopup,
    t,
  );

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
