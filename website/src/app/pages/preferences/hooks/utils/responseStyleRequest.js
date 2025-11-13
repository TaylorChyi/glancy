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

const createAbortChecker = (signal) => () => Boolean(signal?.aborted);

const createSafeDispatch = (dispatch, isAborted) => (action) => {
  if (!isAborted()) {
    dispatch(action);
  }
};

const shouldHydrateWithEmptyProfile = (user, fetchProfile) =>
  !user?.token || typeof fetchProfile !== "function";

const hydrateProfileDetails = ({ dispatch, profileDetailsRef, details }) => {
  profileDetailsRef.current = details;
  dispatch({ type: RESPONSE_STYLE_ACTIONS.hydrate, payload: details });
};

const handleRequestFailure = ({ dispatch, error, isAborted }) => {
  console.error("Failed to load response style preferences", error);
  if (!isAborted()) {
    dispatch({ type: RESPONSE_STYLE_ACTIONS.failure, error });
  }
};

const handleMissingAccess = ({ safeDispatch, profileDetailsRef, user, fetchProfile }) => {
  if (!shouldHydrateWithEmptyProfile(user, fetchProfile)) {
    return false;
  }
  hydrateWithEmptyProfile(safeDispatch, profileDetailsRef);
  return true;
};

const dispatchLoadingState = (dispatch, withLoading) => {
  if (withLoading) {
    dispatch({ type: RESPONSE_STYLE_ACTIONS.loading });
  }
};

const requestProfileDetails = async ({ fetchProfile, token, isAborted }) => {
  const response = await fetchProfile({ token });
  if (isAborted()) {
    return null;
  }
  return mapResponseToProfileDetails(response);
};

const handleSuccessfulRequest = ({
  details,
  dispatch,
  profileDetailsRef,
}) => {
  if (!details) {
    return;
  }
  hydrateProfileDetails({ dispatch, profileDetailsRef, details });
};

const executeProfileFetch = async ({
  fetchProfile,
  user,
  isAborted,
  profileDetailsRef,
  safeDispatch,
}) => {
  const details = await requestProfileDetails({
    fetchProfile,
    token: user.token,
    isAborted,
  });
  handleSuccessfulRequest({
    details,
    dispatch: safeDispatch,
    profileDetailsRef,
  });
};

const executeResponseStyleRequest = async (context) => {
  if (handleMissingAccess(context)) {
    return;
  }

  dispatchLoadingState(context.safeDispatch, context.withLoading);

  try {
    await executeProfileFetch(context);
  } catch (error) {
    handleRequestFailure({
      dispatch: context.safeDispatch,
      error,
      isAborted: context.isAborted,
    });
  }
};

export const createResponseStyleRequest = ({
  dispatch,
  user,
  fetchProfile,
  profileDetailsRef,
}) =>
  async ({ signal, withLoading = true } = {}) => {
    const isAborted = createAbortChecker(signal);
    const safeDispatch = createSafeDispatch(dispatch, isAborted);

    await executeResponseStyleRequest({
      safeDispatch,
      user,
      fetchProfile,
      profileDetailsRef,
      withLoading,
      isAborted,
    });
  };
