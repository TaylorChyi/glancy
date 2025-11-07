import styles from "./UsernameEditor.module.css";
import { UsernameEditorModes } from "./usernameEditorState.js";
import { resolveUsernameErrorMessage } from "./usernameErrorResolver.js";

const composeClassName = (...parts) => parts.filter(Boolean).join(" ");

const buildButtonLabel = (t, mode) => {
  if (mode === UsernameEditorModes.VIEW) {
    return t.changeUsernameButton;
  }
  if (mode === UsernameEditorModes.SAVING) {
    return t.saving;
  }
  return t.saveUsernameButton;
};

const resolveViewValue = (mode, value, emptyDisplayValue) => {
  if (mode !== UsernameEditorModes.VIEW) {
    return value;
  }
  if (!value || value.trim().length === 0) {
    return emptyDisplayValue ?? "";
  }
  return value;
};

const buildInputProps = ({
  controlId,
  messageId,
  mode,
  error,
  value,
  t,
  inputRef,
  handlers,
  inputClassName,
}) => ({
  id: controlId,
  ref: inputRef,
  className: composeClassName(
    styles.input,
    inputClassName,
    error ? styles["input-invalid"] : "",
  ),
  value,
  onChange: handlers.handleChange,
  onKeyDown: handlers.handleKeyDown,
  onBlur: handlers.handleBlur,
  placeholder: t.usernamePlaceholder,
  disabled: mode === UsernameEditorModes.VIEW,
  "aria-invalid": error ? "true" : "false",
  "aria-describedby": error ? messageId : undefined,
});

const buildButtonProps = ({ buttonClassName, handlers, mode }) => ({
  type: "button",
  className: composeClassName(styles.button, buttonClassName),
  onClick: handlers.handleButtonClick,
  disabled: mode === UsernameEditorModes.SAVING,
});

const buildErrorProps = (message, messageId) =>
  message
    ? {
        className: styles["error-message"],
        id: messageId,
        role: "alert",
        message,
      }
    : null;

const createActionDescriptor = (label, handlers, mode) => ({
  label,
  onClick: handlers.handleButtonClick,
  disabled: mode === UsernameEditorModes.SAVING,
  mode,
});

export const composeUsernameViewModel = ({
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
}) => {
  const viewValue = resolveViewValue(mode, value, emptyDisplayValue);
  const inputValue = mode === UsernameEditorModes.VIEW ? viewValue : draft;
  const buttonLabel = buildButtonLabel(t, mode);
  const errorMessage = resolveUsernameErrorMessage(t, error);

  return {
    layout: {
      container: composeClassName(styles.container, className),
      controls: styles.controls,
    },
    inputProps: buildInputProps({
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
    buttonProps: buildButtonProps({
      buttonClassName,
      handlers,
      mode,
    }),
    buttonLabel,
    shouldRenderButton: renderInlineAction,
    errorProps: buildErrorProps(errorMessage, messageId),
    actionDescriptor: createActionDescriptor(buttonLabel, handlers, mode),
  };
};
