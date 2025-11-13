import { useCallback, useMemo } from "react";
import {
  RESPONSE_STYLE_ACTIONS,
  hasFieldChanged,
} from "../sections/responseStyleModel.js";
import {
  ensureAuthenticatedForSave,
  persistResponseStyleChanges,
  synchronizeUnchangedField,
} from "./utils/responseStylePersistence.js";

const clearFieldError = (dispatch) => {
  dispatch({ type: RESPONSE_STYLE_ACTIONS.clearError });
};

const useHandleFieldChange = (dispatch) =>
  useCallback(
    (field, value) => {
      dispatch({ type: RESPONSE_STYLE_ACTIONS.change, field, value });
      clearFieldError(dispatch);
    },
    [dispatch],
  );

const commitUnchangedField = ({ dispatch, field, profileDetailsRef, state }) => {
  synchronizeUnchangedField({
    state,
    field,
    profileDetailsRef,
    dispatch,
  });
};

const handleUnchangedField = ({
  dispatch,
  field,
  profileDetailsRef,
  state,
}) => {
  if (hasFieldChanged(state, field)) {
    return false;
  }
  commitUnchangedField({ dispatch, field, profileDetailsRef, state });
  return true;
};

const startSavingField = (dispatch, field) => {
  dispatch({ type: RESPONSE_STYLE_ACTIONS.saving, field });
};

const handleCommitFailure = (dispatch, error) => {
  console.error("Failed to save response style preferences", error);
  dispatch({ type: RESPONSE_STYLE_ACTIONS.failure, error });
};

const persistFieldChanges = async ({
  dispatch,
  profileDetailsRef,
  saveProfile,
  state,
  user,
}) => {
  await persistResponseStyleChanges({
    state,
    user,
    saveProfile,
    profileDetailsRef,
    dispatch,
  });
};

const saveFieldChanges = async ({
  dispatch,
  profileDetailsRef,
  saveProfile,
  state,
  user,
}) => {
  try {
    await persistFieldChanges({
      dispatch,
      profileDetailsRef,
      saveProfile,
      state,
      user,
    });
  } catch (error) {
    handleCommitFailure(dispatch, error);
  }
};

const ensureAuthorizedToSave = ({ dispatch, saveProfile, user }) =>
  ensureAuthenticatedForSave({ user, saveProfile, dispatch });

const commitFieldChange = async (context) => {
  if (handleUnchangedField(context)) {
    return;
  }

  if (!ensureAuthorizedToSave(context)) {
    return;
  }

  startSavingField(context.dispatch, context.field);
  await saveFieldChanges(context);
};

const useHandleFieldCommit = (params) =>
  useCallback(
    (field) =>
      commitFieldChange({
        field,
        dispatch: params.dispatch,
        profileDetailsRef: params.profileDetailsRef,
        saveProfile: params.saveProfile,
        state: params.state,
        user: params.user,
      }),
    [
      params.dispatch,
      params.profileDetailsRef,
      params.saveProfile,
      params.state,
      params.user,
    ],
  );

export const useResponseStyleHandlers = (params) => {
  const handleFieldChange = useHandleFieldChange(params.dispatch);
  const handleFieldCommit = useHandleFieldCommit(params);

  return useMemo(
    () => ({ handleFieldChange, handleFieldCommit }),
    [handleFieldChange, handleFieldCommit],
  );
};

