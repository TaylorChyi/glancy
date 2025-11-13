import { useEmailRequestCode } from "./useEmailRequestCode.js";
import { useEmailConfirmChange } from "./useEmailConfirmChange.js";
import { useEmailUnbind } from "./useEmailUnbind.js";

export function useEmailBindingWorkflow({
  emailBinding,
  currentUser,
  notifySuccess,
  notifyFailure,
  t,
}) {
  const requestCode = useEmailRequestCode({
    emailBinding,
    notifySuccess,
    notifyFailure,
    t,
  });

  const confirmChange = useEmailConfirmChange({
    emailBinding,
    notifySuccess,
    notifyFailure,
    currentUserEmail: currentUser?.email,
    t,
  });

  const unbind = useEmailUnbind({
    emailBinding,
    notifySuccess,
    notifyFailure,
    t,
  });

  return {
    requestCode,
    confirmChange,
    unbind,
  };
}
