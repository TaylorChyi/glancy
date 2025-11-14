import { resolveUsernameErrorMessage } from "./usernameErrorResolver.js";
import { UsernameEditorModes } from "./usernameEditorState.js";
import { buildLayout } from "./buildUsernameLayout.js";
import { buildButtonLabel } from "./buildUsernameButtonLabel.js";
import { resolveViewValue } from "./resolveUsernameViewValue.js";
import { createInputProps } from "./createUsernameInputProps.js";
import { createButtonProps } from "./createUsernameButtonProps.js";
import { createErrorProps } from "./createUsernameErrorProps.js";
import { createActionDescriptor } from "./createUsernameActionDescriptor.js";

function buildUsernameViewModel(props) {
  const { mode, value, emptyDisplayValue, t } = props;
  const viewValue = resolveViewValue(mode, value, emptyDisplayValue);
  const buttonLabel = buildButtonLabel(t, mode);

  return createUsernameViewModel({
    ...props,
    viewValue,
    buttonLabel,
  });
}

function createUsernameViewModel({
  mode,
  draft,
  error,
  className,
  inputClassName,
  buttonClassName,
  t,
  inputRef,
  handlers,
  controlId,
  messageId,
  renderInlineAction,
  viewValue,
  buttonLabel,
}) {
  const inputValue = mode === UsernameEditorModes.VIEW ? viewValue : draft;
  const errorMessage = resolveUsernameErrorMessage(t, error);

  return {
    layout: buildLayout(className),
    inputProps: createInputProps({
      controlId,
      messageId,
      mode,
      error,
      value: inputValue,
      t,
      inputRef,
      handlers,
      inputClassName,
    }),
    buttonProps: createButtonProps({
      buttonClassName,
      handlers,
      mode,
    }),
    buttonLabel,
    shouldRenderButton: renderInlineAction,
    errorProps: createErrorProps(errorMessage, messageId),
    actionDescriptor: createActionDescriptor(buttonLabel, handlers, mode),
  };
}

export const composeUsernameViewModel = (props) =>
  buildUsernameViewModel(props);
