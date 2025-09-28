import { useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import ThemeIcon from "@/components/ui/Icon";
import SearchBox from "@/components/ui/SearchBox";
import LanguageControls from "./LanguageControls.jsx";
import styles from "./ChatInput.module.css";

const ICON_SIZE = 20;

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
  sourceLanguage,
  sourceLanguageOptions,
  sourceLanguageLabel,
  onSourceLanguageChange,
  targetLanguage,
  targetLanguageOptions,
  targetLanguageLabel,
  onTargetLanguageChange,
  onSwapLanguages,
  swapLabel,
  normalizeSourceLanguageFn,
  normalizeTargetLanguageFn,
}) {
  const isEmpty = value.trim() === "";
  const localRef = useRef(null);
  const textareaRef = inputRef || localRef;
  const formRef = useRef(null);

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
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    },
    [formRef],
  );

  const isVoiceDisabled = typeof onVoice !== "function";

  const handleVoice = useCallback(
    (event) => {
      if (isVoiceDisabled) {
        return;
      }
      event.preventDefault();
      onVoice?.();
    },
    [isVoiceDisabled, onVoice],
  );

  const canSubmit = !isEmpty;

  const hasSourceOptions = Array.isArray(sourceLanguageOptions)
    ? sourceLanguageOptions.length > 0
    : false;
  const hasTargetOptions = Array.isArray(targetLanguageOptions)
    ? targetLanguageOptions.length > 0
    : false;
  const showLanguageControls = hasSourceOptions || hasTargetOptions;

  return (
    <form
      ref={formRef}
      className={styles["input-wrapper"]}
      onSubmit={handleSubmit}
    >
      <SearchBox className={styles["input-surface"]}>
        {showLanguageControls ? (
          <>
            <div className={styles["lang-rail"]}>
              <LanguageControls
                sourceLanguage={sourceLanguage}
                sourceLanguageOptions={sourceLanguageOptions}
                sourceLanguageLabel={sourceLanguageLabel}
                onSourceLanguageChange={onSourceLanguageChange}
                targetLanguage={targetLanguage}
                targetLanguageOptions={targetLanguageOptions}
                targetLanguageLabel={targetLanguageLabel}
                onTargetLanguageChange={onTargetLanguageChange}
                onSwapLanguages={onSwapLanguages}
                swapLabel={swapLabel}
                normalizeSourceLanguage={normalizeSourceLanguageFn}
                normalizeTargetLanguage={normalizeTargetLanguageFn}
              />
            </div>
            <div className={styles["language-divider"]} aria-hidden="true" />
          </>
        ) : null}
        <div className={styles["core-input"]}>
          <textarea
            ref={textareaRef}
            rows={rows}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={styles.textarea}
          />
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles["voice-button"]}
            onClick={handleVoice}
            aria-label={voiceLabel}
            disabled={isVoiceDisabled}
          >
            <ThemeIcon
              name="voice-button"
              alt={voiceLabel}
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          </button>
          <button
            type="submit"
            className={styles["send-button"]}
            aria-label={sendLabel}
            disabled={!canSubmit}
            data-empty={!canSubmit}
          >
            <ThemeIcon
              name="send-button"
              alt={sendLabel}
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          </button>
        </div>
      </SearchBox>
    </form>
  );
}

export default ActionInput;

ActionInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  onVoice: PropTypes.func,
  inputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
  placeholder: PropTypes.string,
  sendLabel: PropTypes.string,
  voiceLabel: PropTypes.string,
  rows: PropTypes.number,
  maxRows: PropTypes.number,
  sourceLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  sourceLanguageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
    }),
  ),
  sourceLanguageLabel: PropTypes.string,
  onSourceLanguageChange: PropTypes.func,
  targetLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  targetLanguageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
    }),
  ),
  targetLanguageLabel: PropTypes.string,
  onTargetLanguageChange: PropTypes.func,
  onSwapLanguages: PropTypes.func,
  swapLabel: PropTypes.string,
  normalizeSourceLanguageFn: PropTypes.func,
  normalizeTargetLanguageFn: PropTypes.func,
};

ActionInput.defaultProps = {
  onChange: undefined,
  onSubmit: undefined,
  onVoice: undefined,
  inputRef: undefined,
  placeholder: undefined,
  sendLabel: "Send",
  voiceLabel: "Voice",
  rows: 1,
  maxRows: 5,
  sourceLanguage: undefined,
  sourceLanguageOptions: [],
  sourceLanguageLabel: undefined,
  onSourceLanguageChange: undefined,
  targetLanguage: undefined,
  targetLanguageOptions: [],
  targetLanguageLabel: undefined,
  onTargetLanguageChange: undefined,
  onSwapLanguages: undefined,
  swapLabel: undefined,
  normalizeSourceLanguageFn: (value) => value,
  normalizeTargetLanguageFn: (value) => value,
};
