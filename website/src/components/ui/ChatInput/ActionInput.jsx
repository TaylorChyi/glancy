import { useCallback, useEffect, useRef } from "react";
import ThemeIcon from "@/components/ui/Icon";
import SearchBox from "@/components/ui/SearchBox";
import styles from "./ChatInput.module.css";

const ICON_SIZE = 36;

/**
 * ActionInput 使用可滚动的 SearchBox 包裹 textarea，并在内部放置操作按钮。
 * 按钮会根据内容是否为空在语音触发与提交之间切换。
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

  const handleChange = useCallback(
    (e) => {
      autoResize(e.target);
      onChange?.(e);
    },
    [autoResize, onChange],
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      onSubmit?.(e);
    },
    [onSubmit],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        handleSubmit(e);
        e.preventDefault();
      }
    },
    [handleSubmit],
  );

  const handleClick = useCallback(
    (e) => {
      if (isEmpty && onVoice) {
        e.preventDefault();
        onVoice();
      }
    },
    [isEmpty, onVoice],
  );

  return (
    <form className={styles["input-wrapper"]} onSubmit={handleSubmit}>
      <SearchBox>
        <textarea
          ref={textareaRef}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={styles.textarea}
        />
      </SearchBox>
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
