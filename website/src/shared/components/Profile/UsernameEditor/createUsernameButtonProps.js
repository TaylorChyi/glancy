import styles from "./UsernameEditor.module.css";
import { UsernameEditorModes } from "./usernameEditorState.js";
import { composeClassName } from "./composeClassName.js";

export const createButtonProps = ({ buttonClassName, handlers, mode }) => ({
  type: "button",
  className: composeClassName(styles.button, buttonClassName),
  onClick: handlers.handleButtonClick,
  disabled: mode === UsernameEditorModes.SAVING,
});
