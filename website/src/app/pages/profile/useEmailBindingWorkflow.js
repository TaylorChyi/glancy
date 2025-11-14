import { useEmailRequestCode } from "./useEmailRequestCode.js";
import { useEmailConfirmChange } from "./useEmailConfirmChange.js";
import { useEmailUnbind } from "./useEmailUnbind.js";

function useRequestCodeBuilder({ emailBinding, notifySuccess, notifyFailure, t }) {
  return useEmailRequestCode({
    emailBinding,
    notifySuccess,
    notifyFailure,
    t,
  });
}

function useConfirmChangeBuilder({
  emailBinding,
  notifySuccess,
  notifyFailure,
  currentUser,
  t,
}) {
  return useEmailConfirmChange({
    emailBinding,
    notifySuccess,
    notifyFailure,
    currentUserEmail: currentUser?.email,
    t,
  });
}

function useUnbindBuilder({ emailBinding, notifySuccess, notifyFailure, t }) {
  return useEmailUnbind({
    emailBinding,
    notifySuccess,
    notifyFailure,
    t,
  });
}

export function useEmailBindingWorkflow(dependencies) {
  const requestCode = useRequestCodeBuilder(dependencies);
  const confirmChange = useConfirmChangeBuilder(dependencies);
  const unbind = useUnbindBuilder(dependencies);

  return { requestCode, confirmChange, unbind };
}
