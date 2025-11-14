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

function createUsernameViewModel(props) {
  return buildUsernameViewModelPayload({
    ...props,
    inputValue:
      props.mode === UsernameEditorModes.VIEW ? props.viewValue : props.draft,
    errorMessage: resolveUsernameErrorMessage(props.t, props.error),
  });
}

function buildUsernameViewModelPayload(payload) {
  return {
    layout: buildLayout(payload.className),
    inputProps: createInputProps({
      controlId: payload.controlId,
      messageId: payload.messageId,
      mode: payload.mode,
      error: payload.error,
      value: payload.inputValue,
      t: payload.t,
      inputRef: payload.inputRef,
      handlers: payload.handlers,
      inputClassName: payload.inputClassName,
    }),
    buttonProps: createButtonProps({
      buttonClassName: payload.buttonClassName,
      handlers: payload.handlers,
      mode: payload.mode,
    }),
    buttonLabel: payload.buttonLabel,
    shouldRenderButton: payload.renderInlineAction,
    errorProps: createErrorProps(payload.errorMessage, payload.messageId),
    actionDescriptor: createActionDescriptor(
      payload.buttonLabel,
      payload.handlers,
      payload.mode,
    ),
  };
}

export const composeUsernameViewModel = (props) =>
  buildUsernameViewModel(props);
