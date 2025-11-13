import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  RESPONSE_STYLE_ACTIONS,
  createResponseStyleInitialState,
  hasFieldChanged,
  responseStyleReducer,
} from "../sections/responseStyleModel.js";
import { createEmptyProfileDetails } from "@app/pages/profile/profileDetailsModel.js";
import {
  ensureAuthenticatedForSave,
  persistResponseStyleChanges,
  synchronizeUnchangedField,
} from "./utils/responseStylePersistence.js";
import { createResponseStyleRequest } from "./utils/responseStyleRequest.js";

const useResponseStyleReducer = () =>
  useReducer(
    responseStyleReducer,
    undefined,
    createResponseStyleInitialState,
  );

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
      createResponseStyleRequest({
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

const useProfileDetailsRef = () => useRef(createEmptyProfileDetails());

const useResponseStyleController = ({
  user,
  fetchProfile,
  saveProfile,
  profileDetailsRef,
}) => {
  const [state, dispatch] = useResponseStyleReducer();

  const { handleRetry } = useResponseStyleRequest({
    dispatch,
    user,
    fetchProfile,
    profileDetailsRef,
  });

  const handlers = useResponseStyleHandlers({
    dispatch,
    state,
    user,
    saveProfile,
    profileDetailsRef,
  });

  return { state, ...handlers, handleRetry };
};

export const useResponseStylePreferences = ({
  user,
  fetchProfile,
  saveProfile,
}) => {
  const profileDetailsRef = useProfileDetailsRef();
  return useResponseStyleController({
    user,
    fetchProfile,
    saveProfile,
    profileDetailsRef,
  });
};
