import { useCallback, useMemo, useState } from "react";
import { persistProfile } from "./profilePersistence.js";

const persistProfileUpdates = ({ api, currentUser, details, phone, persistedMeta }) =>
  persistProfile({ api, currentUser, details, phone, persistedMeta });

const applyProfileSaveSuccess = (
  { hasIdentityUpdates, nextUser },
  { setUser, showPopup, successMessage },
) => {
  if (hasIdentityUpdates) {
    setUser(nextUser);
  }
  showPopup(successMessage);
};

const handleProfileSaveFailure = (error, { showPopup, failureMessage }) => {
  console.error(error);
  showPopup(failureMessage);
};

const createPersistExecutor = ({ api, currentUser, details, phone, persistedMeta }) =>
  () => persistProfileUpdates({ api, currentUser, details, phone, persistedMeta });

const createSuccessHandler = ({ setUser, showPopup, successMessage }) => (result) =>
  applyProfileSaveSuccess(result, { setUser, showPopup, successMessage });

const createFailureHandler = ({ showPopup, failureMessage }) => (error) =>
  handleProfileSaveFailure(error, { showPopup, failureMessage });

const useSaveCallbacks = ({
  api,
  currentUser,
  details,
  phone,
  persistedMeta,
  setUser,
  showPopup,
  successMessage,
  failureMessage,
}) =>
  useMemo(
    () => ({
      persist: createPersistExecutor({ api, currentUser, details, phone, persistedMeta }),
      onSuccess: createSuccessHandler({ setUser, showPopup, successMessage }),
      onFailure: createFailureHandler({ showPopup, failureMessage }),
    }),
    [
      api,
      currentUser,
      details,
      failureMessage,
      persistedMeta,
      phone,
      setUser,
      showPopup,
      successMessage,
    ],
  );

const executeProfileSave = async ({
  event,
  currentUser,
  setIsSaving,
  persist,
  onSuccess,
  onFailure,
}) => {
  event.preventDefault();
  if (!currentUser) {
    return;
  }
  setIsSaving(true);
  try {
    const result = await persist();
    onSuccess(result);
  } catch (error) {
    onFailure(error);
  } finally {
    setIsSaving(false);
  }
};

const selectSaveConfig = (params) => ({
  api: params.api,
  currentUser: params.currentUser,
  details: params.details,
  phone: params.phone,
  persistedMeta: params.persistedMeta,
  setUser: params.setUser,
  showPopup: params.showPopup,
  successMessage: params.successMessage,
  failureMessage: params.failureMessage,
});

export const useSaveHandler = (params) => {
  const { currentUser, setIsSaving } = params;
  const { persist, onSuccess, onFailure } = useSaveCallbacks(
    selectSaveConfig(params),
  );
  return useCallback(
    (event) =>
      executeProfileSave({
        event,
        currentUser,
        setIsSaving,
        persist,
        onSuccess,
        onFailure,
      }),
    [currentUser, onFailure, onSuccess, persist, setIsSaving],
  );
};

export function useProfileSaveHandler(params) {
  const [isSaving, setIsSaving] = useState(false);
  const handleSave = useSaveHandler({
    ...params,
    successMessage: params.t.updateSuccess,
    failureMessage: params.t.fail,
    setIsSaving,
  });
  return { isSaving, handleSave };
}
