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
