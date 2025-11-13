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

const createValidationHandler = ({ dispatch }) => (draft) => {
  const { valid, code, normalized } = validateUsername(draft);
  if (valid) {
    return normalized;
  }
  dispatch({
    type: UsernameEditorActions.SUBMIT_FAILURE,
    error: { code },
  });
  return null;
};

const createNoOpSubmissionHandler = ({ dispatch, value, onSubmit }) => {
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
};

const createSuccessHandler = ({ dispatch, onSuccess }) => (nextValue) => {
  dispatch({
    type: UsernameEditorActions.SUBMIT_SUCCESS,
    value: nextValue,
  });
  onSuccess?.(nextValue);
};

const createFailureHandler = ({ dispatch, onFailure }) => (error) => {
  dispatch({
    type: UsernameEditorActions.SUBMIT_FAILURE,
    error: buildUnknownError(error),
  });
  onFailure?.(error);
};

const useHandleSubmit = ({
  draft,
  value,
  dispatch,
  onSubmit,
  onSuccess,
  onFailure,
}) => {
  const validateDraft = useMemo(
    () => createValidationHandler({ dispatch }),
    [dispatch],
  );
  const handleNoOpSubmission = useMemo(
    () =>
      createNoOpSubmissionHandler({
        dispatch,
        value,
        onSubmit,
      }),
    [dispatch, onSubmit, value],
  );
  const handleSuccess = useMemo(
    () => createSuccessHandler({ dispatch, onSuccess }),
    [dispatch, onSuccess],
  );
  const handleFailure = useMemo(
    () => createFailureHandler({ dispatch, onFailure }),
    [dispatch, onFailure],
  );

  return useCallback(async () => {
    const normalized = validateDraft(draft);
    if (!normalized) {
      return;
    }

    if (handleNoOpSubmission(normalized)) {
      return;
    }

    dispatch({ type: UsernameEditorActions.SUBMIT_START });
    try {
      const result = await onSubmit(normalized);
      const nextValue = result ?? normalized;
      handleSuccess(nextValue);
    } catch (error) {
      handleFailure(error);
    }
  }, [
    dispatch,
    draft,
    handleFailure,
    handleNoOpSubmission,
    handleSuccess,
    onSubmit,
    validateDraft,
  ]);
};

const createHandleChange = ({ dispatch }) =>
  useCallback(
    (event) => {
      dispatch({
        type: UsernameEditorActions.CHANGE,
        value: event.target.value,
      });
    },
    [dispatch],
  );

const createHandleKeyDown = ({ mode, handleSubmit }) =>
  useCallback(
    (event) => {
      if (event.key === "Enter" && mode !== UsernameEditorModes.VIEW) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, mode],
  );

const createHandleBlur = ({ mode, draft, value, dispatch }) =>
  useCallback(() => {
    if (mode !== UsernameEditorModes.EDIT) {
      return;
    }
    if (draft === value) {
      dispatch({ type: UsernameEditorActions.CANCEL_EDIT });
    }
  }, [dispatch, draft, mode, value]);

const createHandleButtonClick = ({ mode, dispatch, handleSubmit }) =>
  useCallback(() => {
    if (mode === UsernameEditorModes.VIEW) {
      dispatch({ type: UsernameEditorActions.START_EDIT });
      return;
    }
    handleSubmit();
  }, [dispatch, handleSubmit, mode]);

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

  const handleChange = createHandleChange({ dispatch });
  const handleKeyDown = createHandleKeyDown({ mode, handleSubmit });
  const handleBlur = createHandleBlur({ mode, draft, value, dispatch });
  const handleButtonClick = createHandleButtonClick({
    mode,
    dispatch,
    handleSubmit,
  });

  return {
    handleBlur,
    handleButtonClick,
    handleChange,
    handleKeyDown,
    handleSubmit,
  };
};
