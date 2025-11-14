import { useCallback, useMemo, useState } from "react";
import { persistProfile } from "./profilePersistence.js";

export function useSavingState(initial = false) {
  return useState(initial);
}

export function createPersistPayload(params, currentUser) {
  return {
    api: params.api,
    currentUser,
    details: params.details,
    phone: params.phone,
    persistedMeta: params.persistedMeta,
  };
}

export function createSaveSuccessParams(params) {
  return {
    setUser: params.setUser,
    showPopup: params.showPopup,
    successMessage: params.successMessage,
  };
}

export function createSaveFailureParams(params) {
  return {
    showPopup: params.showPopup,
    failureMessage: params.failureMessage,
  };
}

export async function executeProfileSave(event, params) {
  event.preventDefault();
  const { currentUser } = params;
  if (!currentUser) {
    return;
  }
  params.setIsSaving(true);
  try {
    const result = await persistProfile(
      createPersistPayload(params, currentUser),
    );
    applyProfileSaveSuccess(result, createSaveSuccessParams(params));
  } catch (error) {
    handleProfileSaveFailure(error, createSaveFailureParams(params));
  } finally {
    params.setIsSaving(false);
  }
}

export function useSaveHandler(params) {
  const config = useMemo(
    () => ({
      api: params.api,
      currentUser: params.currentUser,
      details: params.details,
      phone: params.phone,
      persistedMeta: params.persistedMeta,
      setIsSaving: params.setIsSaving,
      setUser: params.setUser,
      showPopup: params.showPopup,
      successMessage: params.successMessage,
      failureMessage: params.failureMessage,
    }),
    [
      params.api,
      params.currentUser,
      params.details,
      params.failureMessage,
      params.persistedMeta,
      params.phone,
      params.setIsSaving,
      params.setUser,
      params.showPopup,
      params.successMessage,
    ],
  );
  return useCallback((event) => executeProfileSave(event, config), [config]);
}

export function applyProfileSaveSuccess(
  { hasIdentityUpdates, nextUser },
  { setUser, showPopup, successMessage },
) {
  if (hasIdentityUpdates) {
    setUser(nextUser);
  }
  showPopup(successMessage);
}

export function handleProfileSaveFailure(error, { showPopup, failureMessage }) {
  console.error(error);
  showPopup(failureMessage);
}

export function useProfileSaveHandler(params) {
  const [isSaving, setIsSaving] = useSavingState(false);
  const handleSave = useSaveHandler({
    api: params.api,
    currentUser: params.currentUser,
    details: params.details,
    phone: params.phone,
    persistedMeta: params.persistedMeta,
    setIsSaving,
    setUser: params.setUser,
    showPopup: params.showPopup,
    successMessage: params.t.updateSuccess,
    failureMessage: params.t.fail,
  });
  return { isSaving, handleSave };
}
