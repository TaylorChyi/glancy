import { useCallback } from "react";
import { useEmailBinding } from "@shared/hooks";
import { useAvatarEditorController } from "./avatarEditorController.js";
import { useEmailBindingWorkflow } from "./useEmailBindingWorkflow.js";
import { useProfileSaveHandler } from "./useProfileSaveHandler.js";
import { useProfileBootstrap } from "./useProfileBootstrap.js";

function useUsernameWorkflow({ api, currentUser, setUser, popup, t }) {
  const submit = useCallback(
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
      popup.showPopup(t.usernameUpdateSuccess);
      return updatedUsername;
    },
    [api, currentUser, popup, setUser, t.usernameUpdateSuccess],
  );
  const handleFailure = useCallback((error) => {
    console.error(error);
  }, []);
  return { onSubmit: submit, onFailure: handleFailure };
}

function useProfileInitialLoad({
  api,
  currentUser,
  detailsState,
  setPersistedMeta,
  applyAvatar,
  popup,
  t,
}) {
  useProfileBootstrap({
    api,
    currentUser,
    dispatchDetails: detailsState.dispatchDetails,
    setPersistedMeta,
    applyAvatar,
    showError: () => popup.showPopup(t.fail),
  });
}

function useProfileControllers({ api, currentUser, setUser, popup, t }) {
  const usernameHandlers = useUsernameWorkflow({
    api,
    currentUser,
    setUser,
    popup,
    t,
  });
  const avatarController = useAvatarEditorController({
    api,
    currentUser,
    setUser,
    t,
    notifyFailure: () => popup.showPopup(t.fail),
  });
  const emailBinding = useEmailBinding({
    user: currentUser,
    onUserUpdate: setUser,
  });
  const emailWorkflow = useEmailBindingWorkflow({
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

function useProfilePersistence({
  api,
  currentUser,
  detailsState,
  phoneState,
  setUser,
  persistedMeta,
  popup,
  t,
}) {
  const { isSaving, handleSave } = useProfileSaveHandler({
    api,
    currentUser,
    details: detailsState.details,
    phone: phoneState.phone,
    setUser,
    persistedMeta,
    showPopup: popup.showPopup,
    t,
  });
  return { isSaving, handleSave };
}

function useProfileBootstrapper({
  api,
  currentUser,
  detailsState,
  setPersistedMeta,
  avatarController,
  popup,
  t,
}) {
  useProfileInitialLoad({
    api,
    currentUser,
    detailsState,
    setPersistedMeta,
    applyAvatar: avatarController.applyServerAvatar,
    popup,
    t,
  });
}

export function useProfileWorkflows({
  api,
  currentUser,
  setUser,
  popup,
  t,
  detailsState,
  phoneState,
  persistedMeta,
  setPersistedMeta,
}) {
  const controllers = useProfileControllers({
    api,
    currentUser,
    setUser,
    popup,
    t,
  });
  const persistence = useProfilePersistence({
    api,
    currentUser,
    detailsState,
    phoneState,
    setUser,
    persistedMeta,
    popup,
    t,
  });
  useProfileBootstrapper({
    api,
    currentUser,
    detailsState,
    setPersistedMeta,
    avatarController: controllers.avatarController,
    popup,
    t,
  });
  return {
    ...controllers,
    ...persistence,
  };
}
