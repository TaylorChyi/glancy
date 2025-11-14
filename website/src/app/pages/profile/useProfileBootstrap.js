import { useCallback, useEffect, useMemo } from "react";
import { mapResponseToProfileDetails } from "./profileDetailsModel.js";

export async function fetchProfileData({ api, currentUser }) {
  return api.profiles.fetchProfile({ token: currentUser.token });
}

export function applyProfileBootstrapSuccess(data, {
  dispatchDetails,
  setPersistedMeta,
  applyAvatar,
}) {
  dispatchDetails({
    type: "hydrate",
    payload: mapResponseToProfileDetails(data),
  });
  setPersistedMeta({
    dailyWordTarget: data.dailyWordTarget ?? null,
    futurePlan: data.futurePlan ?? null,
  });
  if (data.avatar) {
    applyAvatar(data.avatar);
  }
}

export function handleProfileBootstrapFailure(error, { showError }) {
  console.error(error);
  showError();
}

export function useBootstrapEffect({ currentUser, execute }) {
  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }
    let active = true;
    void execute({ isActive: () => active });
    return () => {
      active = false;
    };
  }, [currentUser, execute]);
}

export function createBootstrapSuccessParams({
  dispatchDetails,
  setPersistedMeta,
  applyAvatar,
}) {
  return { dispatchDetails, setPersistedMeta, applyAvatar };
}

export function createBootstrapFailureParams({ showError }) {
  return { showError };
}

export function useBootstrapSuccessParams(params) {
  return useMemo(
    () =>
      createBootstrapSuccessParams({
        dispatchDetails: params.dispatchDetails,
        setPersistedMeta: params.setPersistedMeta,
        applyAvatar: params.applyAvatar,
      }),
    [params.applyAvatar, params.dispatchDetails, params.setPersistedMeta],
  );
}

export function useBootstrapFailureParams(params) {
  return useMemo(
    () => createBootstrapFailureParams({ showError: params.showError }),
    [params.showError],
  );
}

export function useProfileBootstrap(params) {
  const { api, currentUser } = params;
  const successParams = useBootstrapSuccessParams(params);
  const failureParams = useBootstrapFailureParams(params);
  const execute = useCallback(
    async ({ isActive }) => {
      try {
        const data = await fetchProfileData({
          api,
          currentUser,
        });
        if (isActive()) {
          applyProfileBootstrapSuccess(data, successParams);
        }
      } catch (error) {
        if (isActive()) {
          handleProfileBootstrapFailure(error, failureParams);
        }
      }
    },
    [api, currentUser, failureParams, successParams],
  );
  useBootstrapEffect({ currentUser, execute });
}
