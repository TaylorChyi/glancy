import { useCallback, useMemo } from "react";
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

export const useDraftValidator = (dispatch) =>
  useCallback(
    (draft) => {
      const { valid, code, normalized } = validateUsername(draft);
      if (valid) {
        return normalized;
      }
      dispatch({
        type: UsernameEditorActions.SUBMIT_FAILURE,
        error: { code },
      });
      return null;
    },
    [dispatch],
  );

export const useNoOpSubmission = ({ dispatch, value, onSubmit }) =>
  useMemo(() => {
    if (typeof onSubmit !== "function") {
      return (normalized) => {
        dispatch({
          type: UsernameEditorActions.SUBMIT_SUCCESS,
          value: normalized,
        });
        return true;
      };
    }

    return (normalized) => {
      if (normalized === value) {
        dispatch({ type: UsernameEditorActions.SUBMIT_SUCCESS, value });
        return true;
      }
      return false;
    };
  }, [dispatch, onSubmit, value]);

export const useSubmitSuccessHandler = ({ dispatch, onSuccess }) =>
  useCallback(
    (nextValue) => {
      dispatch({
        type: UsernameEditorActions.SUBMIT_SUCCESS,
        value: nextValue,
      });
      onSuccess?.(nextValue);
    },
    [dispatch, onSuccess],
  );

export const useSubmitFailureHandler = ({ dispatch, onFailure }) =>
  useCallback(
    (error) => {
      dispatch({
        type: UsernameEditorActions.SUBMIT_FAILURE,
        error: buildUnknownError(error),
      });
      onFailure?.(error);
    },
    [dispatch, onFailure],
  );

const useSubmitNormalizedDraft = ({
  dispatch,
  onSubmit,
  handleSuccess,
  handleFailure,
}) =>
  useCallback(
    async (normalized) => {
      dispatch({ type: UsernameEditorActions.SUBMIT_START });
      try {
        const result = await onSubmit(normalized);
        const nextValue = result ?? normalized;
        handleSuccess(nextValue);
      } catch (error) {
        handleFailure(error);
      }
    },
    [dispatch, handleFailure, handleSuccess, onSubmit],
  );

const useHandleSubmit = (options) => {
  const { draft, value, dispatch, onSubmit, onSuccess, onFailure } = options;
  const validateDraft = useDraftValidator(dispatch);
  const handleNoOpSubmission = useNoOpSubmission({ dispatch, value, onSubmit });
  const handleSuccess = useSubmitSuccessHandler({ dispatch, onSuccess });
  const handleFailure = useSubmitFailureHandler({ dispatch, onFailure });
  const submitNormalizedDraft = useSubmitNormalizedDraft({
    dispatch,
    onSubmit,
    handleSuccess,
    handleFailure,
  });

  return useCallback(() => {
    const normalized = validateDraft(draft);
    if (!normalized) {
      return;
    }

    if (handleNoOpSubmission(normalized)) {
      return;
    }

    return submitNormalizedDraft(normalized);
  }, [draft, handleNoOpSubmission, submitNormalizedDraft, validateDraft]);
};

export const useHandleChange = (dispatch) =>
  useCallback(
    (event) => {
      dispatch({
        type: UsernameEditorActions.CHANGE,
        value: event.target.value,
      });
    },
    [dispatch],
  );

export const useHandleKeyDown = ({ mode, handleSubmit }) =>
  useCallback(
    (event) => {
      if (event.key === "Enter" && mode !== UsernameEditorModes.VIEW) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, mode],
  );

export const useHandleBlur = ({ mode, draft, value, dispatch }) =>
  useCallback(() => {
    if (mode !== UsernameEditorModes.EDIT) {
      return;
    }
    if (draft === value) {
      dispatch({ type: UsernameEditorActions.CANCEL_EDIT });
    }
  }, [dispatch, draft, mode, value]);

export const useHandleButtonClick = ({ mode, dispatch, handleSubmit }) =>
  useCallback(() => {
    if (mode === UsernameEditorModes.VIEW) {
      dispatch({ type: UsernameEditorActions.START_EDIT });
      return;
    }
    handleSubmit();
  }, [dispatch, handleSubmit, mode]);

export const useUsernameEditingActions = (options) => {
  const {
    mode,
    value,
    draft,
    dispatch,
    onSubmit,
    onSuccess,
    onFailure,
  } = options;
  const submissionOptions = { draft, value, dispatch, onSubmit, onSuccess, onFailure };
  const handleSubmit = useHandleSubmit(submissionOptions);
  const handleChange = useHandleChange(dispatch);
  const handleKeyDown = useHandleKeyDown({ mode, handleSubmit });
  const handleBlur = useHandleBlur({ mode, draft, value, dispatch });
  const handleButtonClick = useHandleButtonClick({ mode, dispatch, handleSubmit });

  return useMemo(
    () => ({
      handleBlur,
      handleButtonClick,
      handleChange,
      handleKeyDown,
      handleSubmit,
    }),
    [handleBlur, handleButtonClick, handleChange, handleKeyDown, handleSubmit],
  );
};
