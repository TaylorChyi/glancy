import { useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import SearchBox from "@/components/ui/SearchBox";
import LanguageControls from "./LanguageControls.jsx";
import styles from "./ChatInput.module.css";

function EqualizerIcon() {
  return (
    <svg
      className={styles["equalizer-icon"]}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="8" width="3" height="8" rx="1.5" fill="currentColor" />
      <rect x="10.5" y="6" width="3" height="12" rx="1.5" fill="currentColor" />
      <rect x="17" y="10" width="3" height="6" rx="1.5" fill="currentColor" />
    </svg>
  );
}

/**
 * ActionInput 使用可滚动的 SearchBox 包裹 textarea，并在内部放置语言切换与语音控制。
 * 等化器按钮负责触发语音输入，录音按钮在内容就绪时提交查询。
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
  isRecording,
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
  const searchAriaLabel = placeholder || "dictionary search";
  const textareaAriaLabel = placeholder || "search terms";
  const voiceControlsLabel = voiceLabel || "voice controls";
  const recordButtonLabel = sendLabel;

  return (
    <form
      ref={formRef}
      className={styles["input-wrapper"]}
      onSubmit={handleSubmit}
    >
      <SearchBox
        className={styles["input-surface"]}
        role="search"
        aria-label={searchAriaLabel}
        data-testid="searchbar"
      >
        {showLanguageControls ? (
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
        ) : null}
        {showLanguageControls ? (
          <div className={styles["language-divider"]} aria-hidden="true" />
        ) : null}
        <div className={styles["core-input"]}>
          <textarea
            ref={textareaRef}
            rows={rows}
            placeholder={placeholder}
            aria-label={textareaAriaLabel}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={styles.textarea}
          />
        </div>
        <div
          className={styles.actions}
          role="group"
          aria-label={voiceControlsLabel}
        >
          <button
            type="button"
            className={styles["equalizer-button"]}
            onClick={handleVoice}
            aria-label={voiceLabel}
            aria-pressed={false}
            disabled={isVoiceDisabled}
          >
            <EqualizerIcon />
          </button>
          <button
            type="submit"
            className={styles["record-button"]}
            aria-label={recordButtonLabel}
            aria-pressed={isRecording}
            disabled={!canSubmit}
            data-empty={!canSubmit}
            data-recording={isRecording}
          >
            <span className={styles["record-dot"]} aria-hidden="true" />
          </button>
          <span
            className={styles["sr-only"]}
            aria-live="polite"
            aria-atomic="true"
          >
            {isRecording
              ? voiceLabel
                ? `${voiceLabel} active`
                : "Recording active"
              : ""}
          </span>
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
  isRecording: PropTypes.bool,
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
  isRecording: false,
};
