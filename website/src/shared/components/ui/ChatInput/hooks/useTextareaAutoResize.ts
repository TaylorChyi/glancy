/**
 * 背景：
 *  - 原有自适应高度逻辑与主 Hook 紧耦合，导致文件行数与复杂度叠加。
 * 目的：
 *  - 抽离自动调高策略为独立 Hook，运用“策略模式”暴露 resize 行为，方便未来替换实现。
 * 关键决策与取舍：
 *  - 默认策略基于 CSS line-height 估算高度，保持与旧实现一致；
 *  - 当 window 无法访问（SSR）时退化为常量高度，确保无崩溃风险。
 * 影响范围：
 *  - ChatInput 的 textarea 自适应高度逻辑以及相关测试。
 * 演进与TODO：
 *  - 可在后续提供不同的 resize 策略（如基于 ResizeObserver）并通过参数注入。
 */
import { useCallback, useEffect } from "react";
import type React from "react";

const DEFAULT_LINE_HEIGHT = 20;

const getLineHeight = (element: HTMLTextAreaElement): number => {
  if (
    typeof window === "undefined" ||
    typeof window.getComputedStyle !== "function"
  ) {
    return DEFAULT_LINE_HEIGHT;
  }
  const computed =
    window.getComputedStyle(element).lineHeight ?? `${DEFAULT_LINE_HEIGHT}`;
  const parsed = Number.parseFloat(computed);
  return Number.isFinite(parsed) ? parsed : DEFAULT_LINE_HEIGHT;
};

export interface UseTextareaAutoResizeParams {
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  maxRows: number;
  value: string;
}

export interface UseTextareaAutoResizeResult {
  resize: (element: HTMLTextAreaElement | null) => void;
}

export const useTextareaAutoResize = ({
  textareaRef,
  maxRows,
  value,
}: UseTextareaAutoResizeParams): UseTextareaAutoResizeResult => {
  const resize = useCallback(
    (element: HTMLTextAreaElement | null) => {
      if (!element) {
        return;
      }
      const lineHeight = getLineHeight(element);
      const maxHeight = lineHeight * maxRows;
      element.style.height = "auto";
      const nextHeight = Math.min(element.scrollHeight, maxHeight);
      element.style.height = `${nextHeight}px`;
    },
    [maxRows],
  );

  useEffect(() => {
    if (textareaRef.current) {
      resize(textareaRef.current);
    }
  }, [resize, textareaRef, value]);

  return { resize };
};
