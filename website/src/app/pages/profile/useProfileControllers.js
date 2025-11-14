import { useCallback } from "react";
import { useEmailBinding } from "@shared/hooks";
import { useAvatarEditorController } from "./avatarEditorController.js";
import { useEmailBindingWorkflow } from "./useEmailBindingWorkflow.js";

export function useUsernameHandlers({
  api,
  currentUser,
  setUser,
  popup,
  successMessage,
}) {
  const onSubmit = useCallback(
    async (nextUsername) => {
      if (!currentUser) {
        throw new Error("User session is unavailable");
      }
      const response = await api.users.updateUsername({
        userId: currentUser.id,
        username: nextUsername,
        token: currentUser.token,
      });
      const updatedUsername = response.username ?? nextUsername;
      setUser({ ...currentUser, username: updatedUsername });
      popup.showPopup(successMessage);
      return updatedUsername;
    },
    [api, currentUser, popup, setUser, successMessage],
  );
  const onFailure = useCallback((error) => {
    console.error(error);
  }, []);
  return { onSubmit, onFailure };
}

export function useEmailWorkflow({
  emailBinding,
  currentUser,
  notifySuccess,
  notifyFailure,
  t,
}) {
  return useEmailBindingWorkflow({
    emailBinding,
    currentUser,
    notifySuccess,
    notifyFailure,
    t,
  });
}

export function useProfileControllers({ api, currentUser, setUser, popup, t }) {
  const usernameHandlers = useUsernameHandlers({
    api,
    currentUser,
    setUser,
    popup,
    successMessage: t.usernameUpdateSuccess,
  });
  const avatarController = useAvatarEditorController({
    api,
    currentUser,
    setUser,
    t,
    notifyFailure: () => popup.showPopup(t.fail),
  });
  const emailBinding = useEmailBinding({ user: currentUser, onUserUpdate: setUser });
  const emailWorkflow = useEmailWorkflow({
    emailBinding,
    currentUser,
    notifySuccess: popup.showPopup,
    notifyFailure: popup.showPopup,
    t,
  });
  return {
    usernameHandlers,
    avatarController,
    emailBinding,
    emailWorkflow,
  };
}

export default useProfileControllers;
