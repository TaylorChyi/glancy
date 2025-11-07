import { useCallback, useRef } from "react";
import type React from "react";

export interface UseTextareaFocusBridgeParams {
  inputRef?: React.Ref<HTMLTextAreaElement> | null;
}

export interface UseTextareaFocusBridgeResult {
  formRef: React.MutableRefObject<HTMLFormElement | null>;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  setTextareaRef: (node: HTMLTextAreaElement | null) => void;
  restoreFocus: () => void;
  releaseFocus: () => void;
}

export const useTextareaFocusBridge = ({
  inputRef,
}: UseTextareaFocusBridgeParams): UseTextareaFocusBridgeResult => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const syncExternalRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      if (!inputRef) {
        return;
      }
      if (typeof inputRef === "function") {
        inputRef(node);
        return;
      }

      try {
        (
          inputRef as React.MutableRefObject<HTMLTextAreaElement | null>
        ).current = node;
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "ActionInput 接收到不可写入的 inputRef，已回退为内部引用。",
            error,
          );
        }
      }
    },
    [inputRef],
  );

  /**
   * 意图：提供稳定的聚焦恢复入口，避免按钮点击后焦点遗失。
   * 输入：无；依赖内部 textarea 引用。
   * 输出：调用时尝试将焦点移回 textarea。
   * 流程：
   *  1) 读取内部 ref，若存在则执行 focus(preventScroll)。
   * 错误处理：若节点不存在则静默跳过。
   * 复杂度：O(1)。
   */
  const restoreFocus = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    if (typeof textarea.focus === "function") {
      textarea.focus({ preventScroll: true });
    }
  }, []);

  /**
   * 意图：在提交触发时主动释放输入焦点，驱动底部面板回落至释义模式。
   * 输入：依赖内部 textarea 引用。
   * 输出：若存在 textarea，调用其 blur 方法。
   * 流程：
   *  1) 读取内部 textarea；
   *  2) 若具备 blur 能力则执行以触发 onBlur 链路；
   * 错误处理：节点缺失或不具备 blur 时静默退化；
   * 复杂度：O(1)。
   */
  const releaseFocus = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || typeof textarea.blur !== "function") {
      return;
    }
    textarea.blur();
  }, []);

  const setTextareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      textareaRef.current = node;
      syncExternalRef(node);
    },
    [syncExternalRef],
  );

  return {
    formRef,
    textareaRef,
    setTextareaRef,
    restoreFocus,
    releaseFocus,
  };
};
