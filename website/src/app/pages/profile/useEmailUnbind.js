import { useCallback } from "react";
import { resolveEmailErrorMessage } from "./emailErrorMessages.js";

export function useEmailUnbind({ emailBinding, notifySuccess, notifyFailure, t }) {
  return useCallback(async () => {
    try {
      await emailBinding.unbindEmail();
      emailBinding.startEditing();
      notifySuccess(t.emailUnbindSuccess);
    } catch (error) {
      console.error(error);
      notifyFailure(resolveEmailErrorMessage(error, t));
    }
  }, [emailBinding, notifyFailure, notifySuccess, t]);
}
