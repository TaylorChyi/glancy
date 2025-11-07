import { useEffect } from "react";
import { mapResponseToProfileDetails } from "./profileDetailsModel.js";

export function useProfileBootstrap({
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
    let active = true;
    api.profiles
      .fetchProfile({ token: currentUser.token })
      .then((data) => {
        if (!active) {
          return;
        }
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
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        console.error(error);
        showError();
      });
    return () => {
      active = false;
    };
  }, [
    api,
    applyAvatar,
    currentUser,
    dispatchDetails,
    setPersistedMeta,
    showError,
  ]);
}
