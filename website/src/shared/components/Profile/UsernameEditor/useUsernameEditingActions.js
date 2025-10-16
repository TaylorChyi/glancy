/**
 * 背景：
 *  - UsernameEditor 的交互动作（输入、提交、键盘操作）与视图渲染存在不同演进节奏；
 *  - 将动作拆分为专属 Hook，有利于在 lint 迁移后维持较小的视图文件并增强复用性。
 * 目的：
 *  - 输出稳定的事件处理函数集合，统一处理验证、状态派发与回调触发；
 *  - 隔离副作用逻辑，便于单测覆盖与未来扩展其他动作。
 * 关键决策与取舍：
 *  - 继续复用状态机动作常量，保证控制器与 reducer 保持语义一致；
 *  - 提供失败信息规范化逻辑，兼容服务端 message 与本地 code。
 * 影响范围：
 *  - UsernameEditor 控制器 Hook；
 *  - 单测可直接针对该 Hook 验证交互行为。
 * 演进与TODO：
 *  - 若后续支持撤销或节流，可在此扩展新的处理函数并封装策略。
 */
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
      dispatch({ type: UsernameEditorActions.CHANGE, value: event.target.value });
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
