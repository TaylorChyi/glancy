import { useCallback } from "react";
import {
  mapToDisplayValue,
  formatPhoneDisplay,
} from "./utils/displayValues.js";

export const buildAccountSnapshot = ({
  user,
  fallbackValue,
  defaultPhoneCode,
}) => {
  const sanitizedUsername =
    typeof user?.username === "string" ? user.username.trim() : "";
  const hasBoundEmail =
    typeof user?.email === "string" && user.email.trim().length > 0;

  return Object.freeze({
    sanitizedUsername,
    usernameValue: mapToDisplayValue(sanitizedUsername, fallbackValue),
    emailValue: mapToDisplayValue(user?.email, fallbackValue),
    phoneValue: formatPhoneDisplay(user?.phone, {
      fallbackValue,
      defaultCode: defaultPhoneCode,
    }),
    hasBoundEmail,
  });
};

export const useEmailUnbindCommand = ({ accountSnapshot, emailBinding }) => {
  const {
    unbindEmail: performEmailUnbind,
    isUnbinding: isEmailUnbinding,
    startEditing: beginEmailRebinding,
  } = emailBinding ?? {};

  const handleEmailUnbind = useCallback(async () => {
    if (!accountSnapshot.hasBoundEmail) {
      return;
    }
    if (typeof performEmailUnbind !== "function") {
      console.error("Email unbind command unavailable in preferences context");
      return;
    }
    try {
      await performEmailUnbind();
      if (typeof beginEmailRebinding === "function") {
        beginEmailRebinding();
      }
    } catch (error) {
      console.error("Failed to unbind email from preferences", error);
    }
  }, [accountSnapshot.hasBoundEmail, beginEmailRebinding, performEmailUnbind]);

  return { handleEmailUnbind, isEmailUnbinding: Boolean(isEmailUnbinding) };
};
