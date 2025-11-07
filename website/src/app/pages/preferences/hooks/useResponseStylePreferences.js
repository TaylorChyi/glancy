import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  RESPONSE_STYLE_ACTIONS,
  createResponseStyleInitialState,
  hasFieldChanged,
  responseStyleReducer,
} from "../sections/responseStyleModel.js";
import {
  createEmptyProfileDetails,
  mapResponseToProfileDetails,
} from "@app/pages/profile/profileDetailsModel.js";
import {
  ensureAuthenticatedForSave,
  persistResponseStyleChanges,
  synchronizeUnchangedField,
} from "./utils/responseStylePersistence.js";

const hydrateWithEmptyProfile = (dispatch, profileDetailsRef) => {
  profileDetailsRef.current = createEmptyProfileDetails();
  dispatch({
    type: RESPONSE_STYLE_ACTIONS.hydrate,
    payload: profileDetailsRef.current,
  });
};

const createRequestResponseStyle =
  ({ dispatch, user, fetchProfile, profileDetailsRef }) =>
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

const useResponseStyleHandlers = ({
  dispatch,
  state,
  user,
  saveProfile,
  profileDetailsRef,
}) => {
  const handleFieldChange = useCallback(
    (field, value) => {
      dispatch({
        type: RESPONSE_STYLE_ACTIONS.change,
        field,
        value,
      });
      dispatch({ type: RESPONSE_STYLE_ACTIONS.clearError });
    },
    [dispatch],
  );

  const handleFieldCommit = useCallback(
    async (field) => {
      if (!hasFieldChanged(state, field)) {
        synchronizeUnchangedField({
          state,
          field,
          profileDetailsRef,
          dispatch,
        });
        return;
      }

      if (!ensureAuthenticatedForSave({ user, saveProfile, dispatch })) {
        return;
      }

      dispatch({
        type: RESPONSE_STYLE_ACTIONS.saving,
        field,
      });

      try {
        await persistResponseStyleChanges({
          state,
          user,
          saveProfile,
          profileDetailsRef,
          dispatch,
        });
      } catch (error) {
        console.error("Failed to save response style preferences", error);
        dispatch({ type: RESPONSE_STYLE_ACTIONS.failure, error });
      }
    },
    [dispatch, profileDetailsRef, saveProfile, state, user],
  );

  return { handleFieldChange, handleFieldCommit };
};

const useResponseStyleRequest = ({
  dispatch,
  user,
  fetchProfile,
  profileDetailsRef,
}) => {
  const requestResponseStyle = useMemo(
    () =>
      createRequestResponseStyle({
        dispatch,
        user,
        fetchProfile,
        profileDetailsRef,
      }),
    [dispatch, fetchProfile, profileDetailsRef, user],
  );

  useEffect(() => {
    const controller = new AbortController();
    requestResponseStyle({ signal: controller.signal });
    return () => controller.abort();
  }, [requestResponseStyle]);

  const handleRetry = useCallback(() => {
    requestResponseStyle({ withLoading: true });
  }, [requestResponseStyle]);

  return { handleRetry };
};

export const useResponseStylePreferences = ({
  user,
  fetchProfile,
  saveProfile,
}) => {
  const [state, dispatch] = useReducer(
    responseStyleReducer,
    undefined,
    createResponseStyleInitialState,
  );
  const profileDetailsRef = useRef(createEmptyProfileDetails());

  const { handleRetry } = useResponseStyleRequest({
    dispatch,
    user,
    fetchProfile,
    profileDetailsRef,
  });

  const { handleFieldChange, handleFieldCommit } = useResponseStyleHandlers({
    dispatch,
    state,
    user,
    saveProfile,
    profileDetailsRef,
  });

  return {
    state,
    handleRetry,
    handleFieldChange,
    handleFieldCommit,
  };
};
