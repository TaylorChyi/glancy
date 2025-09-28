import { useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import SearchBox from "@/components/ui/SearchBox";
import LanguageControls from "./LanguageControls.jsx";
import styles from "./ChatInput.module.css";

const MIC_ICON_SIZE = 18;

function MicIcon({ className }) {
  return (
    <svg
      className={className}
      width={MIC_ICON_SIZE}
      height={MIC_ICON_SIZE}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9 11.75a2.75 2.75 0 0 0 2.75-2.75V5a2.75 2.75 0 0 0-5.5 0v4c0 1.52 1.23 2.75 2.75 2.75Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 8.5V9a4.5 4.5 0 0 0 9 0v-.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 13.5V16"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 16h5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

MicIcon.propTypes = {
  className: PropTypes.string,
};

MicIcon.defaultProps = {
  className: undefined,
};

/**
 * ActionInput 使用 SearchBox 包裹 textarea，并在内部放置语音触发按钮。
 * 表单提交通过 Enter 或隐藏的提交按钮触发，语音触发具备节流防抖保护。
 */
function ActionInput({
  value,
  onChange,
  onSubmit,
  onVoice,
  inputRef,
  placeholder,
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
  onMenuOpen,
}) {
  const isEmpty = value.trim() === "";
  const localRef = useRef(null);
  const textareaRef = inputRef || localRef;
  const formRef = useRef(null);
  const voiceCooldownRef = useRef(0);

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
      if (isEmpty) {
        return;
      }
      onSubmit?.(e);
    },
    [isEmpty, onSubmit],
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
      const now = Date.now();
      if (now - voiceCooldownRef.current < 500) {
        return;
      }
      voiceCooldownRef.current = now;
      onVoice?.();
    },
    [isVoiceDisabled, onVoice],
  );

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
                onMenuOpen={onMenuOpen}
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
          <button
            type="submit"
            className={styles["submit-proxy"]}
            tabIndex={-1}
            aria-hidden="true"
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
            <MicIcon className={styles["voice-icon"]} />
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
  onMenuOpen: PropTypes.func,
};

ActionInput.defaultProps = {
  onChange: undefined,
  onSubmit: undefined,
  onVoice: undefined,
  inputRef: undefined,
  placeholder: undefined,
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
  onMenuOpen: undefined,
};
