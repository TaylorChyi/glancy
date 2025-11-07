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
