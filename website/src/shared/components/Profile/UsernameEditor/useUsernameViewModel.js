import { useEffect, useMemo } from "react";
import { composeUsernameViewModel } from "./usernameEditorViewModel.js";

const useActionResolutionEffect = (onResolveAction, descriptor) => {
  useEffect(() => {
    if (typeof onResolveAction === "function") {
      onResolveAction(descriptor);
    }
  }, [descriptor, onResolveAction]);
};

const composeViewModelOptions = ({
  state: { mode, value, draft, error },
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
}) => ({
  mode,
  value,
  draft,
  error,
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
});

const viewModelDependencies = ({
  state: { mode, value, draft, error },
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
  mode,
  value,
  draft,
  error,
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

export const useUsernameViewModel = (params) => {
  const viewModel = useMemo(
    () => composeUsernameViewModel(composeViewModelOptions(params)),
    viewModelDependencies(params),
  );

  useActionResolutionEffect(params.onResolveAction, viewModel.actionDescriptor);

  return viewModel;
};
