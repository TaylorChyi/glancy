import { useEffect, useMemo } from "react";
import { composeUsernameViewModel } from "./usernameEditorViewModel.js";

const useActionResolutionEffect = (onResolveAction, descriptor) => {
  useEffect(() => {
    if (typeof onResolveAction === "function") {
      onResolveAction(descriptor);
    }
  }, [descriptor, onResolveAction]);
};

export const useUsernameViewModel = (params) => {
  const {
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
  } = params;
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

  useActionResolutionEffect(onResolveAction, viewModel.actionDescriptor);

  return viewModel;
};
