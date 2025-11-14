/* eslint-env jest */
import { act, renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";
import {
  useDraftValidator,
  useNoOpSubmission,
  useSubmitSuccessHandler,
  useSubmitFailureHandler,
  useHandleChange,
  useHandleKeyDown,
  useHandleBlur,
  useHandleButtonClick,
} from "@shared/components/Profile/UsernameEditor/useUsernameEditingActions.js";
import {
  UsernameEditorActions,
  UsernameEditorModes,
} from "@shared/components/Profile/UsernameEditor/usernameEditorState.js";

const registerDraftValidatorTests = () => {
  test("useDraftValidator normalizes valid usernames without dispatching failures", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() => useDraftValidator(dispatch));

    expect(result.current("  glancy  ")).toBe("glancy");
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("useDraftValidator reports validation errors when username is invalid", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() => useDraftValidator(dispatch));

    expect(result.current("ab")).toBeNull();
    expect(dispatch).toHaveBeenCalledWith({
      type: UsernameEditorActions.SUBMIT_FAILURE,
      error: { code: "too-short" },
    });
  });
};

const registerNoOpSubmissionTests = () => {
  test("useNoOpSubmission resolves immediately when onSubmit is not provided", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      useNoOpSubmission({ dispatch, value: "taylor" }),
    );

    expect(result.current("glancy")).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({
      type: UsernameEditorActions.SUBMIT_SUCCESS,
      value: "glancy",
    });
  });

  test("useNoOpSubmission only dispatches success when normalized matches existing value", () => {
    const dispatch = jest.fn();
    const onSubmit = jest.fn();
    const { result } = renderHook(() =>
      useNoOpSubmission({ dispatch, value: "taylor", onSubmit }),
    );

    expect(result.current("taylor")).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({
      type: UsernameEditorActions.SUBMIT_SUCCESS,
      value: "taylor",
    });

    dispatch.mockClear();
    expect(result.current("glancy")).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });
};

const registerSubmitSuccessHandlerTests = () => {
  test("useSubmitSuccessHandler dispatches success and invokes callback", () => {
    const dispatch = jest.fn();
    const onSuccess = jest.fn();
    const { result } = renderHook(() =>
      useSubmitSuccessHandler({ dispatch, onSuccess }),
    );

    act(() => {
      result.current("next-user");
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: UsernameEditorActions.SUBMIT_SUCCESS,
      value: "next-user",
    });
    expect(onSuccess).toHaveBeenCalledWith("next-user");
  });
};

const registerSubmitFailureHandlerTests = () => {
  test("useSubmitFailureHandler dispatches normalized error and invokes callback", () => {
    const dispatch = jest.fn();
    const onFailure = jest.fn();
    const { result } = renderHook(() =>
      useSubmitFailureHandler({ dispatch, onFailure }),
    );
    const error = new Error("request failed");

    act(() => {
      result.current(error);
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: UsernameEditorActions.SUBMIT_FAILURE,
      error: { message: "request failed" },
    });
    expect(onFailure).toHaveBeenCalledWith(error);
  });
};

const registerHandleChangeTests = () => {
  test("useHandleChange dispatches change action with the latest target value", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() => useHandleChange(dispatch));

    act(() => {
      result.current({ target: { value: "neo" } });
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: UsernameEditorActions.CHANGE,
      value: "neo",
    });
  });
};

const registerHandleKeyDownTests = () => {
  test("useHandleKeyDown triggers submit on Enter outside of view mode", () => {
    const handleSubmit = jest.fn();
    const preventDefault = jest.fn();
    const event = { key: "Enter", preventDefault };
    const { result } = renderHook(() =>
      useHandleKeyDown({
        mode: UsernameEditorModes.EDIT,
        handleSubmit,
      }),
    );

    act(() => {
      result.current(event);
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
};

const registerHandleBlurTests = () => {
  test("useHandleBlur cancels edit when draft matches persisted value", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      useHandleBlur({
        mode: UsernameEditorModes.EDIT,
        draft: "neo",
        value: "neo",
        dispatch,
      }),
    );

    act(() => {
      result.current();
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: UsernameEditorActions.CANCEL_EDIT,
    });
  });
};

const registerHandleButtonClickTests = () => {
  test("useHandleButtonClick toggles between edit and submit flows", () => {
    const dispatch = jest.fn();
    const handleSubmit = jest.fn();

    const { result: startEdit } = renderHook(() =>
      useHandleButtonClick({
        mode: UsernameEditorModes.VIEW,
        dispatch,
        handleSubmit,
      }),
    );

    act(() => {
      startEdit.current();
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: UsernameEditorActions.START_EDIT,
    });

    dispatch.mockClear();
    const { result: submit } = renderHook(() =>
      useHandleButtonClick({
        mode: UsernameEditorModes.EDIT,
        dispatch,
        handleSubmit,
      }),
    );

    act(() => {
      submit.current();
    });

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(dispatch).not.toHaveBeenCalled();
  });
};

describe("useUsernameEditingActions helpers", () => {
  registerDraftValidatorTests();
  registerNoOpSubmissionTests();
  registerSubmitSuccessHandlerTests();
  registerSubmitFailureHandlerTests();
  registerHandleChangeTests();
  registerHandleKeyDownTests();
  registerHandleBlurTests();
  registerHandleButtonClickTests();
});
