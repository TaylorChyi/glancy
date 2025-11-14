import { useId, useRef } from "react";
import {
  useEditFocusManagement,
  useUsernameSynchronization,
} from "./usernameEditorEffects.js";
import { useUsernameEditingActions } from "./useUsernameEditingActions.js";
import { useUsernameViewModel } from "./useUsernameViewModel.js";
import { useUsernameEditorState } from "./useUsernameEditorState.js";

const controllerDefaults = {
  className: "",
  inputClassName: "",
  buttonClassName: "",
  renderInlineAction: true,
};

const buildControllerResult = (state, viewModel) => ({
  mode: state.mode,
  layout: viewModel.layout,
  inputProps: viewModel.inputProps,
  buttonProps: viewModel.buttonProps,
  buttonLabel: viewModel.buttonLabel,
  shouldRenderButton: viewModel.shouldRenderButton,
  errorProps: viewModel.errorProps,
});

function useUsernameControllerState(username) {
  const [state, dispatch] = useUsernameEditorState(username);
  const inputRef = useRef(null);
  const controlId = useId();
  const messageId = useId();

  useUsernameSynchronization(username, dispatch);
  useEditFocusManagement(state.mode, inputRef);

  return { state, dispatch, inputRef, controlId, messageId };
}

function useUsernameControllerHandlers({
  state,
  dispatch,
  onSubmit,
  onSuccess,
  onFailure,
}) {
  return useUsernameEditingActions({
    mode: state.mode,
    value: state.value,
    draft: state.draft,
    dispatch,
    onSubmit,
    onSuccess,
    onFailure,
  });
}

function useUsernameControllerViewModel({
  state,
  handlers,
  emptyDisplayValue,
  className,
  inputClassName,
  buttonClassName,
  t,
  inputRef,
  controlId,
  messageId,
  renderInlineAction,
  onResolveAction,
}) {
  return useUsernameViewModel({
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
}

export default function useUsernameEditorController(userProps) {
  const {
    username,
    className,
    inputClassName,
    buttonClassName,
    renderInlineAction,
    ...handlersProps
  } = { ...controllerDefaults, ...userProps };
  const controllerState = useUsernameControllerState(username);
  const handlers = useUsernameControllerHandlers({
    state: controllerState.state,
    dispatch: controllerState.dispatch,
    onSubmit: handlersProps.onSubmit,
    onSuccess: handlersProps.onSuccess,
    onFailure: handlersProps.onFailure,
  });
  const viewModel = useUsernameControllerViewModel({
    ...controllerState,
    emptyDisplayValue: handlersProps.emptyDisplayValue,
    className,
    inputClassName,
    buttonClassName,
    t: handlersProps.t,
    handlers,
    renderInlineAction,
    onResolveAction: handlersProps.onResolveAction,
  });
  return buildControllerResult(controllerState.state, viewModel);
}
