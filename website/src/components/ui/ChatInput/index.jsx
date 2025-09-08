import { useCallback, useEffect, useRef } from "react";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./ChatInput.module.css";

/**
 * Chat input field with dual submit/voice behaviour.
 * When the field is empty the button acts as a voice trigger
 * instead of submitting the form.
 */
function ChatInput({
  value,
  onChange,
  onSubmit,
  onVoice,
  inputRef,
  placeholder,
  sendLabel = "Send",
  voiceLabel = "Voice",
  rows = 1,
  maxRows = 5,
}) {
  const isEmpty = value.trim() === "";
  const localRef = useRef(null);
  const textareaRef = inputRef || localRef;

  const autoResize = useCallback(
    (el) => {
      const lineHeight = parseFloat(
        window.getComputedStyle(el).lineHeight || "20",
      );
      const maxHeight = lineHeight * maxRows;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    },
    [maxRows],
  );

  useEffect(() => {
    if (textareaRef.current) {
      autoResize(textareaRef.current);
    }
  }, [autoResize, value, textareaRef]);

  const handleClick = (e) => {
    if (isEmpty && onVoice) {
      e.preventDefault();
      onVoice();
    }
  };

  const handleChange = (e) => {
    autoResize(e.target);
    onChange?.(e);
  };

  return (
    <form className={styles.container} onSubmit={onSubmit}>
      <textarea
        ref={textareaRef}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={styles.textarea}
      />
      <button
        type={isEmpty ? "button" : "submit"}
        className={styles.button}
        onClick={handleClick}
        aria-label={isEmpty ? voiceLabel : sendLabel}
      >
        {isEmpty ? (
          <ThemeIcon
            name="voice-button"
            alt={voiceLabel}
            className={styles.icon}
          />
        ) : (
          <ThemeIcon
            name="send-button"
            alt={sendLabel}
            className={styles.icon}
          />
        )}
      </button>
    </form>
  );
}

export default ChatInput;
