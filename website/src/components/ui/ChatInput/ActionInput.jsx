/**
 * 背景：
 *  - 语音触发与消息发送共享一个操作入口，现状为双按钮结构，存在交互冗余。
 * 目的：
 *  - 提供统一的动作按钮，根据输入态自动切换语音与发送能力，减少误操作。
 * 关键决策与取舍：
 *  - 采用局部状态机（ActionButton）实现状态切换，重用现有节流逻辑，避免引入全局管理。
 *  - 放弃均衡器入口，后续若需可在 ActionButton 内扩展菜单式交互。
 * 影响范围：
 *  - ChatInput 表单的动作区布局与可访问性标签。
 * 演进与TODO：
 *  - 后续可在语音态补充录音进度反馈，或引入长按手势。
 */
import { useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import SearchBox from "@/components/ui/SearchBox";
import LanguageControls from "./LanguageControls.jsx";
import styles from "./ChatInput.module.css";

const ACTION_BUTTON_COOLDOWN_MS = 500;

function SendIcon({ className }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.25 15.75L16.5 9 2.25 2.25l4.5 6L2.25 15.75z"
        fill="currentColor"
      />
    </svg>
  );
}

SendIcon.propTypes = {
  className: PropTypes.string,
};

SendIcon.defaultProps = {
  className: undefined,
};

/**
 * 意图：提供语音/发送的单一入口，根据输入状态自动切换动作。
 * 输入：
 *  - value：当前输入内容，用于判定是否展示发送态。
 *  - isRecording：语音是否进行中，驱动 pressed 状态。
 *  - voiceCooldownRef：节流引用，防止频繁触发语音。
 *  - onVoice/onSubmit：对应语音与提交的回调。
 * 输出：返回具备正确 aria 属性的按钮元素。
 * 流程：
 *  1) 基于 value.trim() 判定语音/发送态。
 *  2) 点击时复用节流逻辑触发相应回调。
 * 错误处理：禁用态下静默返回；节流窗口内忽略重复点击。
 * 复杂度：O(1)，仅依赖常量时间判定。
 */
function ActionButton({
  value,
  isRecording,
  voiceCooldownRef,
  onVoice,
  onSubmit,
  isVoiceDisabled,
  sendLabel,
  voiceLabel,
}) {
  const trimmedLength = value.trim().length;
  const isSendState = trimmedLength > 0;
  const ariaLabel = isSendState ? sendLabel : voiceLabel;
  const actionClassName = [
    styles["action-button"],
    styles[isSendState ? "action-button-send" : "action-button-voice"],
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = useCallback(
    (event) => {
      event.preventDefault();
      if (isSendState) {
        onSubmit?.();
        return;
      }
      if (isVoiceDisabled) {
        return;
      }
      const now = Date.now();
      if (now - voiceCooldownRef.current < ACTION_BUTTON_COOLDOWN_MS) {
        return;
      }
      voiceCooldownRef.current = now;
      onVoice?.();
    },
    [isSendState, isVoiceDisabled, onSubmit, onVoice, voiceCooldownRef],
  );

  return (
    <button
      type="button"
      className={actionClassName}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-pressed={
        isSendState ? undefined : Boolean(isRecording)
      }
      disabled={isSendState ? false : isVoiceDisabled}
    >
      {isSendState ? (
        <SendIcon className={styles["action-button-icon"]} />
      ) : (
        <span className={styles["action-button-dot"]} />
      )}
    </button>
  );
}

ActionButton.propTypes = {
  value: PropTypes.string.isRequired,
  isRecording: PropTypes.bool,
  voiceCooldownRef: PropTypes.shape({ current: PropTypes.number }).isRequired,
  onVoice: PropTypes.func,
  onSubmit: PropTypes.func,
  isVoiceDisabled: PropTypes.bool,
  sendLabel: PropTypes.string.isRequired,
  voiceLabel: PropTypes.string.isRequired,
};

ActionButton.defaultProps = {
  isRecording: false,
  onVoice: undefined,
  onSubmit: undefined,
  isVoiceDisabled: false,
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
  sendLabel = "Send",
  rows = 1,
  maxRows = 5,
  isRecording = false,
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

  const handleActionSubmit = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

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
        <div className={styles["input-surface-top"]}>
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
        </div>
        <div className={styles["input-surface-bottom"]}>
          <div className={styles["input-bottom-left"]}>
            {showLanguageControls ? (
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
            ) : null}
          </div>
          <div className={styles["input-bottom-right"]}>
            <ActionButton
              value={value}
              isRecording={isRecording}
              voiceCooldownRef={voiceCooldownRef}
              onVoice={onVoice}
              onSubmit={handleActionSubmit}
              isVoiceDisabled={isVoiceDisabled}
              sendLabel={sendLabel}
              voiceLabel={voiceLabel}
            />
          </div>
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
  sendLabel: PropTypes.string,
  rows: PropTypes.number,
  maxRows: PropTypes.number,
  isRecording: PropTypes.bool,
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
  sendLabel: "Send",
  rows: 1,
  maxRows: 5,
  isRecording: false,
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
