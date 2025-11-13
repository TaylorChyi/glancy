import styles from "./UsernameEditor.module.css";
import { UsernameEditorModes } from "./usernameEditorState.js";
import { composeClassName } from "./composeClassName.js";

export const createInputProps = ({
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
