import { useProfileSaveHandler } from "./useProfileSaveHandler.js";
import { useProfileBootstrap } from "./useProfileBootstrap.js";
import { useProfileControllers } from "./useProfileControllers.js";

export function useProfilePersistence({
  api,
  currentUser,
  detailsState,
  phoneState,
  setUser,
  persistedMeta,
  popup,
  t,
}) {
  return useProfileSaveHandler({
    api,
    currentUser,
    details: detailsState.details,
    phone: phoneState.phone,
    setUser,
    persistedMeta,
    showPopup: popup.showPopup,
    t,
  });
}

export function useProfileBootstrapper({
  api,
  currentUser,
  detailsState,
  setPersistedMeta,
  avatarController,
  popup,
  t,
}) {
  useProfileBootstrap({
    api,
    currentUser,
    dispatchDetails: detailsState.dispatchDetails,
    setPersistedMeta,
    applyAvatar: avatarController.applyServerAvatar,
    showError: () => popup.showPopup(t.fail),
  });
}

export function createPersistenceParams({
  api,
  currentUser,
  detailsState,
  phoneState,
  setUser,
  persistedMeta,
  popup,
  t,
}) {
  return {
    api,
    currentUser,
    detailsState,
    phoneState,
    setUser,
    persistedMeta,
    popup,
    t,
  };
}

export function createBootstrapParams(
  params,
  avatarController,
) {
  return {
    api: params.api,
    currentUser: params.currentUser,
    detailsState: params.detailsState,
    setPersistedMeta: params.setPersistedMeta,
    avatarController,
    popup: params.popup,
    t: params.t,
  };
}

export function useProfileWorkflows(params) {
  const controllers = useProfileControllers(params);
  const persistence = useProfilePersistence(createPersistenceParams(params));
  useProfileBootstrapper(
    createBootstrapParams(params, controllers.avatarController),
  );
  return {
    ...controllers,
    ...persistence,
  };
}

export default useProfileWorkflows;
