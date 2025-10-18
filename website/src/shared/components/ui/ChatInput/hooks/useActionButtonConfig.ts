/**
 * 背景：
 *  - 行为按钮属性（语音、发送、冷却）分散在主 Hook 中，影响可读性。
 * 目的：
 *  - 将按钮配置组合为独立 Hook，强调数据与行为封装。
 * 关键决策与取舍：
 *  - 将 sendLabel、voiceLabel 的默认值内聚于此，避免主 Hook 再次硬编码；
 *  - 使用 useMemo 保持返回对象引用稳定。
 * 影响范围：
 *  - ChatInput 行为按钮与语音开关交互。
 * 演进与TODO：
 *  - 后续可在此整合按钮禁用策略或埋点。
 */
import { useMemo } from "react";
import type React from "react";

import type { UseActionInputBehaviorResult } from "./useActionInputBehavior.types";

export interface UseActionButtonConfigParams {
  value: string;
  isRecording?: boolean;
  voiceCooldownRef: React.MutableRefObject<number>;
  onVoice?: () => void;
  onSubmit: () => void;
  sendLabel?: string;
  voiceLabel?: string;
  restoreFocus: () => void;
}

export const useActionButtonConfig = ({
  value,
  isRecording,
  voiceCooldownRef,
  onVoice,
  onSubmit,
  sendLabel,
  voiceLabel,
  restoreFocus,
}: UseActionButtonConfigParams): UseActionInputBehaviorResult["actionButtonProps"] =>
  useMemo(
    () => ({
      value,
      isRecording,
      voiceCooldownRef,
      onVoice,
      onSubmit,
      isVoiceDisabled: typeof onVoice !== "function",
      sendLabel: sendLabel ?? "Send",
      voiceLabel: voiceLabel ?? "Voice",
      restoreFocus,
    }),
    [
      isRecording,
      onSubmit,
      onVoice,
      restoreFocus,
      sendLabel,
      value,
      voiceCooldownRef,
      voiceLabel,
    ],
  );
