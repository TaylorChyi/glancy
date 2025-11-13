import { RESPONSE_STYLE_ACTIONS } from "../../sections/responseStyleModel.js";
import {
  createEmptyProfileDetails,
  mapResponseToProfileDetails,
} from "@app/pages/profile/profileDetailsModel.js";

const hydrateWithEmptyProfile = (dispatch, profileDetailsRef) => {
  profileDetailsRef.current = createEmptyProfileDetails();
  dispatch({
    type: RESPONSE_STYLE_ACTIONS.hydrate,
    payload: profileDetailsRef.current,
  });
};

export const createResponseStyleRequest = ({
  dispatch,
  user,
  fetchProfile,
  profileDetailsRef,
}) =>
  async ({ signal, withLoading = true } = {}) => {
    const abortRequested = () => Boolean(signal?.aborted);
    const safeDispatch = (action) => {
      if (!abortRequested()) {
        dispatch(action);
      }
    };

    if (!user?.token || typeof fetchProfile !== "function") {
      hydrateWithEmptyProfile(safeDispatch, profileDetailsRef);
      return;
    }

    if (withLoading) {
      safeDispatch({ type: RESPONSE_STYLE_ACTIONS.loading });
    }

    try {
      const response = await fetchProfile({ token: user.token });
      if (abortRequested()) {
        return;
      }
      const details = mapResponseToProfileDetails(response);
      profileDetailsRef.current = details;
      safeDispatch({
        type: RESPONSE_STYLE_ACTIONS.hydrate,
        payload: details,
      });
    } catch (error) {
      console.error("Failed to load response style preferences", error);
      if (abortRequested()) {
        return;
      }
      safeDispatch({ type: RESPONSE_STYLE_ACTIONS.failure, error });
    }
  };
