import { useCallback } from "react";
import { resolveEmailErrorMessage } from "./emailErrorMessages.js";

export function useEmailBindingWorkflow({
  emailBinding,
  currentUser,
  notifySuccess,
  notifyFailure,
  t,
}) {
  const requestCode = useCallback(
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

  const confirmChange = useCallback(
    async ({ email: nextEmail, code }) => {
      const hadEmailBeforeSubmit = Boolean(currentUser?.email);
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
    [currentUser?.email, emailBinding, notifyFailure, notifySuccess, t],
  );

  const unbind = useCallback(async () => {
    try {
      await emailBinding.unbindEmail();
      emailBinding.startEditing();
      notifySuccess(t.emailUnbindSuccess);
    } catch (error) {
      console.error(error);
      notifyFailure(resolveEmailErrorMessage(error, t));
    }
  }, [emailBinding, notifyFailure, notifySuccess, t]);

  return {
    requestCode,
    confirmChange,
    unbind,
  };
}
