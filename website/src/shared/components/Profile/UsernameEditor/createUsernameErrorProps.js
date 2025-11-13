import styles from "./UsernameEditor.module.css";

export const createErrorProps = (message, messageId) =>
  message
    ? {
        className: styles["error-message"],
        id: messageId,
        role: "alert",
        message,
      }
    : null;
