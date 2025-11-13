import { useEffect, useMemo } from "react";
import { composeUsernameViewModel } from "./usernameEditorViewModel.js";

const buildViewModelDependencies = ({
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
}) => [
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
];

const useActionResolutionEffect = (onResolveAction, descriptor) => {
  useEffect(() => {
    if (typeof onResolveAction === "function") {
      onResolveAction(descriptor);
    }
  }, [descriptor, onResolveAction]);
};

export const useUsernameViewModel = (params) => {
  const dependencies = buildViewModelDependencies(params);
  const viewModel = useMemo(
    () =>
      composeUsernameViewModel({
        mode: params.state.mode,
        value: params.state.value,
        draft: params.state.draft,
        error: params.state.error,
        emptyDisplayValue: params.emptyDisplayValue,
        className: params.className,
        inputClassName: params.inputClassName,
        buttonClassName: params.buttonClassName,
        t: params.t,
        inputRef: params.inputRef,
        handlers: params.handlers,
        controlId: params.controlId,
        messageId: params.messageId,
        renderInlineAction: params.renderInlineAction,
      }),
    dependencies,
  );

  useActionResolutionEffect(params.onResolveAction, viewModel.actionDescriptor);

  return viewModel;
};
