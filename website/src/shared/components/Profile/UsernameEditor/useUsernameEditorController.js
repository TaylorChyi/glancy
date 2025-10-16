/**
 * 背景：
 *  - UsernameEditor 需要在 lint 迁移后遵守结构化规则，原先的组件文件无法承载所有状态与副作用；
 *  - 将控制器拆分为 Hook，有助于复用状态机并保持渲染层精简。
 * 目的：
 *  - 组合状态机、交互动作与视图模型，向组件暴露一致的渲染数据；
 *  - 统一调用 onResolveAction，支持外部容器订阅按钮行为。
 * 关键决策与取舍：
 *  - 控制器只承担 orchestrator 角色，实际计算交由 effects/actions/viewModel 模块；
 *  - 通过 useMemo 限定视图模型的重建频率，避免无意义的副作用触发。
 * 影响范围：
 *  - UsernameEditor 组件与其单测；
 *  - lint 结构化规则豁免列表，可移除对 UsernameEditor 的特殊处理。
 * 演进与TODO：
 *  - 若未来引入更多动作或装饰器，可在 actions/viewModel 模块扩展接口。
 */
import { useId, useReducer, useRef } from "react";
import {
  createUsernameEditorInitialState,
  usernameEditorReducer,
} from "./usernameEditorState.js";
import {
  useEditFocusManagement,
  useUsernameSynchronization,
} from "./usernameEditorEffects.js";
import { useUsernameEditingActions } from "./useUsernameEditingActions.js";
import { useUsernameViewModel } from "./useUsernameViewModel.js";

export default function useUsernameEditorController({
  username,
  emptyDisplayValue,
  className = "",
  inputClassName = "",
  buttonClassName = "",
  renderInlineAction = true,
  onSubmit,
  onSuccess,
  onFailure,
  onResolveAction,
  t,
}) {
  const [state, dispatch] = useReducer(
    usernameEditorReducer,
    username ?? "",
    createUsernameEditorInitialState,
  );
  const inputRef = useRef(null);
  const controlId = useId();
  const messageId = useId();

  useUsernameSynchronization(username, dispatch);
  useEditFocusManagement(state.mode, inputRef);

  const handlers = useUsernameEditingActions({
    mode: state.mode,
    value: state.value,
    draft: state.draft,
    dispatch,
    onSubmit,
    onSuccess,
    onFailure,
  });

  const viewModel = useUsernameViewModel({
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
  });

  return {
    mode: state.mode,
    layout: viewModel.layout,
    inputProps: viewModel.inputProps,
    buttonProps: viewModel.buttonProps,
    buttonLabel: viewModel.buttonLabel,
    shouldRenderButton: viewModel.shouldRenderButton,
    errorProps: viewModel.errorProps,
  };
}
