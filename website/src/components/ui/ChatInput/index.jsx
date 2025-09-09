import ActionInput from "./ActionInput";
import styles from "./ChatInput.module.css";

function ChatInput(props) {
  return (
    <div className={styles.container}>
      <ActionInput {...props} />
    </div>
  );
}

export default ChatInput;
