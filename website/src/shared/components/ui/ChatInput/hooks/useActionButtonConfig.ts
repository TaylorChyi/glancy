/**
 * 背景：
 *  - 行为按钮属性（语音、发送、冷却）分散在主 Hook 中，影响可读性。
 * 目的：
 *  - 将按钮配置组合为独立 Hook，强调数据与行为封装。
 * 关键决策与取舍：
 *  - sendLabel 默认值集中于此，保持容器参数轻量；
 *  - 使用 useMemo 保持返回对象引用稳定并避免重复构造。
 * 影响范围：
 *  - ChatInput 行为按钮与提交策略。
 * 演进与TODO：
 *  - 后续可在此扩展多动作策略或并入快捷键埋点。
 */
import { useMemo } from "react";
import type { UseActionInputBehaviorResult } from "./useActionInputBehavior.types";

export interface UseActionButtonConfigParams {
  value: string;
  onSubmit: () => void;
  sendLabel?: string;
  restoreFocus: () => void;
}

export const useActionButtonConfig = ({
  value,
  onSubmit,
  sendLabel,
  restoreFocus,
}: UseActionButtonConfigParams): UseActionInputBehaviorResult["actionButtonProps"] =>
  useMemo(
    () => ({
      canSubmit: value.trim().length > 0,
      onSubmit,
      sendLabel: sendLabel ?? "Send",
      restoreFocus,
    }),
    [onSubmit, restoreFocus, sendLabel, value],
  );
