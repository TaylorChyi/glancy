import { useCallback } from "react";
import { validateUsername } from "@shared/utils/validators.js";
import {
  UsernameEditorActions,
  UsernameEditorModes,
} from "./usernameEditorState.js";

const buildUnknownError = (error) => {
  const message =
    typeof error?.message === "string" && error.message.trim()
      ? error.message
      : undefined;
  return message ? { message } : { code: "unknown" };
};

const useHandleSubmit = ({
  draft,
  value,
  dispatch,
  onSubmit,
  onSuccess,
  onFailure,
}) =>
  useCallback(async () => {
    const { valid, code, normalized } = validateUsername(draft);
    if (!valid) {
      dispatch({
        type: UsernameEditorActions.SUBMIT_FAILURE,
        error: { code },
      });
      return;
    }

    if (normalized === value) {
      dispatch({ type: UsernameEditorActions.SUBMIT_SUCCESS, value });
      return;
    }

    if (typeof onSubmit !== "function") {
      dispatch({
        type: UsernameEditorActions.SUBMIT_SUCCESS,
        value: normalized,
      });
      return;
    }

    dispatch({ type: UsernameEditorActions.SUBMIT_START });
    try {
      const result = await onSubmit(normalized);
      const nextValue = result ?? normalized;
      dispatch({
        type: UsernameEditorActions.SUBMIT_SUCCESS,
        value: nextValue,
      });
      onSuccess?.(nextValue);
    } catch (error) {
      dispatch({
        type: UsernameEditorActions.SUBMIT_FAILURE,
        error: buildUnknownError(error),
      });
      onFailure?.(error);
    }
  }, [dispatch, draft, onFailure, onSubmit, onSuccess, value]);

export const useUsernameEditingActions = ({
  mode,
  value,
  draft,
  dispatch,
  onSubmit,
  onSuccess,
  onFailure,
}) => {
  const handleSubmit = useHandleSubmit({
    draft,
    value,
    dispatch,
    onSubmit,
    onSuccess,
    onFailure,
  });

  const handleChange = useCallback(
    (event) => {
      dispatch({
        type: UsernameEditorActions.CHANGE,
        value: event.target.value,
      });
    },
    [dispatch],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && mode !== UsernameEditorModes.VIEW) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, mode],
  );

  const handleBlur = useCallback(() => {
    if (mode !== UsernameEditorModes.EDIT) {
      return;
    }
    if (draft === value) {
      dispatch({ type: UsernameEditorActions.CANCEL_EDIT });
    }
  }, [dispatch, draft, mode, value]);

  const handleButtonClick = useCallback(() => {
    if (mode === UsernameEditorModes.VIEW) {
      dispatch({ type: UsernameEditorActions.START_EDIT });
      return;
    }
    handleSubmit();
  }, [dispatch, handleSubmit, mode]);

  return {
    handleBlur,
    handleButtonClick,
    handleChange,
    handleKeyDown,
    handleSubmit,
  };
};
