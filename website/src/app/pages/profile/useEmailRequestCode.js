import { useCallback } from "react";
import { resolveEmailErrorMessage } from "./emailErrorMessages.js";

export function useEmailRequestCode({
  emailBinding,
  notifySuccess,
  notifyFailure,
  t,
}) {
  return useCallback(
    async (nextEmail) => {
      if (!nextEmail) {
        notifyFailure(t.emailInputRequired);
        return false;
      }
      try {
        await emailBinding.requestCode(nextEmail);
        notifySuccess(t.emailCodeSent);
        return true;
      } catch (error) {
        console.error(error);
        notifyFailure(resolveEmailErrorMessage(error, t));
        return false;
      }
    },
    [emailBinding, notifyFailure, notifySuccess, t],
  );
}
