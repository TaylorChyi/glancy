import { useId, useRef } from "react";
import {
  useEditFocusManagement,
  useUsernameSynchronization,
} from "./usernameEditorEffects.js";
import { useUsernameEditingActions } from "./useUsernameEditingActions.js";
import { useUsernameViewModel } from "./useUsernameViewModel.js";
import { useUsernameEditorState } from "./useUsernameEditorState.js";

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
  const [state, dispatch] = useUsernameEditorState(username);
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
