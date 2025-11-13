import styles from "./UsernameEditor.module.css";
import { composeClassName } from "./composeClassName.js";

export const buildLayout = (className) => ({
  container: composeClassName(styles.container, className),
  controls: styles.controls,
});
