import { useEffect, useMemo, useState } from "react";
import { resolveInitialMethod } from "./authFormPrimitives.js";
import { useFeedbackChannels } from "./authFormFeedback.js";
import { useUnavailableMethodHandler } from "./authFormHandlers.js";

const deriveAvailableMethods = (formMethods) =>
  Array.isArray(formMethods) ? formMethods : [];

const deriveOrderedMethods = (methodOrder) =>
  Array.isArray(methodOrder) ? methodOrder : [];

const useAuthMethodResolution = ({ formMethods, methodOrder, defaultMethod }) => {
  const availableFormMethods = useMemo(
    () => deriveAvailableMethods(formMethods),
    [formMethods],
  );
  const orderedMethods = useMemo(
    () => deriveOrderedMethods(methodOrder),
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

const useAuthToastLabel = (t) =>
  useMemo(() => t.toastDismissLabel || t.close || "Dismiss notification", [t]);

const useAuthOtherOptionsLabel = (otherOptionsLabel, t) =>
  useMemo(() => {
    const fallback = t.otherLoginOptions ?? "Other login options";
    const trimmed =
      typeof otherOptionsLabel === "string" ? otherOptionsLabel.trim() : "";
    return trimmed || fallback;
  }, [otherOptionsLabel, t]);

const useAuthFeedback = (t) => {
  const feedback = useFeedbackChannels();
  const onUnavailableMethod = useUnavailableMethodHandler(
    feedback.showPopup,
    t,
  );

  return { feedback, onUnavailableMethod };
};

export {
  deriveAvailableMethods,
  deriveOrderedMethods,
  useAuthFeedback,
  useAuthMethodResolution,
  useAuthOtherOptionsLabel,
  useAuthToastLabel,
};
