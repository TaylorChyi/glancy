/**
 * 背景：
 *  - ChatInput 需要在单一入口内平衡语音触发与文本发送的两种动作。
 * 目的：
 *  - 以状态策略模式组织按钮行为，通过输入态与节流器决定执行路径。
 * 关键决策与取舍：
 *  - 采用输入非空 -> 发送、否则 -> 语音的二元策略，避免维护额外枚举状态机。
 *  - 节流窗口保持在组件内部，隔离全局时间依赖，必要时可替换为策略实现。
 * 影响范围：
 *  - ChatInput 表单底部的动作按钮与语音控制体验。
 * 演进与TODO：
 *  - 后续如需插入更多动作，可抽象策略表以支持多态扩展。
 */
import { useCallback } from "react";
import PropTypes from "prop-types";

import styles from "../ChatInput.module.css";
import { SendIcon, VoiceIcon } from "../icons";
import useIconToneController from "@/hooks/useIconToneController.js";

const ACTION_BUTTON_COOLDOWN_MS = 500;

function ActionButton({
  value,
  isRecording,
  voiceCooldownRef,
  onVoice,
  onSubmit,
  isVoiceDisabled,
  sendLabel,
  voiceLabel,
  restoreFocus,
}) {
  const trimmedLength = value.trim().length;
  const isSendState = trimmedLength > 0;
  const ariaLabel = isSendState ? sendLabel : voiceLabel;
  const { isInverse: shouldInvertIconTone } = useIconToneController({
    tone: "inverse",
  });

  //
  // 背景：
  //  - 语音/发送按钮的壳体在两种主题下都会与整体主题色形成对比色，如果直接继承文本色会出现低对比。
  // 取舍：
  //  - 复用图标色调控制器统一注入 inverse 语义，避免组件内分散维护 theme 判断，并为后续扩展更多 tone 预留空间。
  const actionClassName = [
    styles["action-button"],
    styles[isSendState ? "action-button-send" : "action-button-voice"],
    shouldInvertIconTone ? styles["action-button-inverse-icon"] : null,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = useCallback(
    (event) => {
      event.preventDefault();
      if (isSendState) {
        onSubmit?.();
        restoreFocus?.();
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
      restoreFocus?.();
    },
    [
      isSendState,
      isVoiceDisabled,
      onSubmit,
      onVoice,
      voiceCooldownRef,
      restoreFocus,
    ],
  );

  return (
    <button
      type="button"
      className={actionClassName}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-pressed={isSendState ? undefined : Boolean(isRecording)}
      disabled={isSendState ? false : isVoiceDisabled}
    >
      {isSendState ? (
        <SendIcon className={styles["action-button-icon"]} />
      ) : (
        <VoiceIcon className={styles["action-button-icon"]} />
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
  restoreFocus: PropTypes.func,
};

ActionButton.defaultProps = {
  isRecording: false,
  onVoice: undefined,
  onSubmit: undefined,
  isVoiceDisabled: false,
  restoreFocus: undefined,
};

export default ActionButton;
