import { useCallback, useEffect, useRef } from "react";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./ChatInput.module.css";

const ICON_SIZE = 36;

/**
 * ActionInput renders a textarea with an internally positioned action button.
 * The button toggles between voice trigger and form submit depending on the
 * trimmed content value.
 */
function ActionInput({
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

  const handleChange = (e) => {
    autoResize(e.target);
    onChange?.(e);
  };

  const handleClick = (e) => {
    if (isEmpty && onVoice) {
      e.preventDefault();
      onVoice();
    }
  };

  return (
    <form className={styles["input-wrapper"]} onSubmit={onSubmit}>
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
        className={styles["action-button"]}
        onClick={handleClick}
        aria-label={isEmpty ? voiceLabel : sendLabel}
      >
        {isEmpty ? (
          <ThemeIcon
            name="voice-button"
            alt={voiceLabel}
            width={ICON_SIZE}
            height={ICON_SIZE}
          />
        ) : (
          <ThemeIcon
            name="send-button"
            alt={sendLabel}
            width={ICON_SIZE}
            height={ICON_SIZE}
          />
        )}
      </button>
    </form>
  );
}

export default ActionInput;
