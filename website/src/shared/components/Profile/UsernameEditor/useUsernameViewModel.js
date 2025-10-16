/**
 * 背景：
 *  - 控制器 Hook 需要复用视图模型计算与外部动作分发逻辑；
 *  - 为满足 lint 限制，将视图模型构建封装为独立 Hook。
 * 目的：
 *  - 基于状态与配置计算视图所需的属性集合，并在模型变化时通知 onResolveAction；
 *  - 提供稳定引用的视图模型，降低组件重渲染噪声。
 * 关键决策与取舍：
 *  - 使用 useMemo 限定派生计算触发；
 *  - 在同一 Hook 内处理 onResolveAction，避免控制器重复书写副作用。
 * 影响范围：
 *  - UsernameEditor 控制器 Hook 与外部动作订阅方。
 * 演进与TODO：
 *  - 若后续需要缓存更多派生信息，可在此扩展返回结构。
 */
import { useEffect, useMemo } from "react";
import { composeUsernameViewModel } from "./usernameEditorViewModel.js";

export const useUsernameViewModel = ({
  state,
  emptyDisplayValue,
  className,
  inputClassName,
  buttonClassName,
  t,
  inputRef,
  handlers,
  controlId,
  messageId,
  renderInlineAction,
  onResolveAction,
}) => {
  const viewModel = useMemo(
    () =>
      composeUsernameViewModel({
        mode: state.mode,
        value: state.value,
        draft: state.draft,
        error: state.error,
        emptyDisplayValue,
        className,
        inputClassName,
        buttonClassName,
        t,
        inputRef,
        handlers,
        controlId,
        messageId,
        renderInlineAction,
      }),
    [
      state.mode,
      state.value,
      state.draft,
      state.error,
      emptyDisplayValue,
      className,
      inputClassName,
      buttonClassName,
      t,
      inputRef,
      handlers,
      controlId,
      messageId,
      renderInlineAction,
    ],
  );

  useEffect(() => {
    if (typeof onResolveAction === "function") {
      onResolveAction(viewModel.actionDescriptor);
    }
  }, [onResolveAction, viewModel.actionDescriptor]);

  return viewModel;
};
