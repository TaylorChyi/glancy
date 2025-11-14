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

const useSyncExternalRef = (
  inputRef?: React.Ref<HTMLTextAreaElement> | null,
) =>
  useCallback(
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

const useTextareaFocusHandlers = (
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>,
) => {
  const restoreFocus = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    if (typeof textarea.focus === "function") {
      textarea.focus({ preventScroll: true });
    }
  }, [textareaRef]);

  const releaseFocus = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || typeof textarea.blur !== "function") {
      return;
    }
    textarea.blur();
  }, [textareaRef]);

  return { restoreFocus, releaseFocus };
};

export const useTextareaFocusBridge = ({
  inputRef,
}: UseTextareaFocusBridgeParams): UseTextareaFocusBridgeResult => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const syncExternalRef = useSyncExternalRef(inputRef);
  const { restoreFocus, releaseFocus } = useTextareaFocusHandlers(textareaRef);

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
