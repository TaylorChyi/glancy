/**
 * 背景：
 *  - 输入框变化时既要触发 resize，又需向外冒泡事件，原实现多处重复。
 * 目的：
 *  - 提供统一的 onChange 处理器，组合自适应高度与外部回调逻辑。
 * 关键决策与取舍：
 *  - 通过 useCallback 固定返回引用，避免 textarea 每次输入都重新绑定；
 *  - 保持事件透传顺序，先执行 resize 再回调 onChange。
 * 影响范围：
 *  - ChatInput 输入框自适应高度与外部状态同步。
 * 演进与TODO：
 *  - 可在后续加入输入节流或埋点。
 */
import { useCallback } from "react";
import type React from "react";

export interface UseTextareaChangeHandlerParams {
  resize: (element: HTMLTextAreaElement | null) => void;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const useTextareaChangeHandler = ({
  resize,
  onChange,
}: UseTextareaChangeHandlerParams) =>
  useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      resize(event.target);
      onChange?.(event);
    },
    [onChange, resize],
  );
