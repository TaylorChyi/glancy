import { useCallback } from "react";
import { resolveEmailErrorMessage } from "./emailErrorMessages.js";

export function useEmailConfirmChange({
  emailBinding,
  notifySuccess,
  notifyFailure,
  currentUserEmail,
  t,
}) {
  return useCallback(
    async ({ email: nextEmail, code }) => {
      const hadEmailBeforeSubmit = Boolean(currentUserEmail);
      try {
        await emailBinding.confirmChange({ email: nextEmail, code });
        notifySuccess(
          hadEmailBeforeSubmit ? t.emailChangeSuccess : t.emailBindSuccess,
        );
      } catch (error) {
        console.error(error);
        notifyFailure(resolveEmailErrorMessage(error, t));
      }
    },
    [currentUserEmail, emailBinding, notifyFailure, notifySuccess, t],
  );
}
