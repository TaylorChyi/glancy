import { useEffect } from "react";
import { mapResponseToProfileDetails } from "./profileDetailsModel.js";

const fetchProfile = (api, token) => api.profiles.fetchProfile({ token });

const hydrateProfileState = (dispatchDetails, data) => {
  dispatchDetails({
    type: "hydrate",
    payload: mapResponseToProfileDetails(data),
  });
};

const applyPersistedMeta = (setPersistedMeta, data) => {
  setPersistedMeta({
    dailyWordTarget: data.dailyWordTarget ?? null,
    futurePlan: data.futurePlan ?? null,
  });
};

const applyProfileAvatar = (applyAvatar, data) => {
  if (data.avatar) {
    applyAvatar(data.avatar);
  }
};

const handleBootstrapSuccess = (data, { dispatchDetails, setPersistedMeta, applyAvatar }) => {
  hydrateProfileState(dispatchDetails, data);
  applyPersistedMeta(setPersistedMeta, data);
  applyProfileAvatar(applyAvatar, data);
};

const handleBootstrapFailure = (error, showError) => {
  console.error(error);
  showError();
};

const startBootstrapRequest = ({ api, currentUser, onSuccess, onFailure }) => {
  let active = true;
  fetchProfile(api, currentUser.token)
    .then((data) => {
      if (!active) return;
      onSuccess(data);
    })
    .catch((error) => {
      if (!active) return;
      onFailure(error);
    });
  return () => {
    active = false;
  };
};

export function useBootstrapEffect({
  api,
  currentUser,
  dispatchDetails,
  setPersistedMeta,
  applyAvatar,
  showError,
}) {
  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }
    return startBootstrapRequest({
      api,
      currentUser,
      onSuccess: (data) =>
        handleBootstrapSuccess(data, { dispatchDetails, setPersistedMeta, applyAvatar }),
      onFailure: (error) => handleBootstrapFailure(error, showError),
    });
  }, [
    api,
    applyAvatar,
    currentUser,
    dispatchDetails,
    setPersistedMeta,
    showError,
  ]);
}

export function useProfileBootstrap(params) {
  useBootstrapEffect(params);
}
