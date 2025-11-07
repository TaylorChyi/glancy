import usernameEditorStyles from "@shared/components/Profile/UsernameEditor/UsernameEditor.module.css";
import styles from "../Preferences.module.css";

export const DETAIL_INPUT_CLASSNAME = [
  usernameEditorStyles.input,
  styles["detail-input"],
]
  .filter(Boolean)
  .join(" ");

export const DETAIL_ACTION_BUTTON_CLASSNAME = [
  styles["avatar-trigger"],
  styles["detail-action-button"],
]
  .filter(Boolean)
  .join(" ");
