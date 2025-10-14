/**
 * 背景：
 *  - ChatInput 需要在文本输入、语音触发与语言选择之间平衡复杂交互，单组件内难以维护。
 * 目的：
 *  - 提供可复用的行为层 Hook，统一管理自适应高度、提交拦截及语言区显隐策略，供容器注入。
 * 关键决策与取舍：
 *  - 通过集中副作用（自适应高度、提交代理）降低展示层复杂度，改以纯函数 Props 注入视图。
 *  - 采用局部引用聚合（回调 Ref + 内部 Ref）兼容外部引用需求，避免破坏既有 API。
 * 影响范围：
 *  - ChatInput 行为逻辑与相关单测的触达方式。
 * 演进与TODO：
 *  - 后续可在此处扩展动作策略映射或接入特性开关以支持更多输入模式。
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import type React from "react";

export type LanguageValue = string | symbol | undefined;

export interface LanguageOption {
  value: string | symbol;
  label: string;
}

export interface FocusChangeContext {
  /**
   * 聚焦态标记：true 表示 textarea 获得焦点，false 表示失焦。
   */
  isFocused: boolean;
  /**
   * 原始焦点事件，外部可借助 relatedTarget/currentTarget 等信息判断上下文。
   */
  event: React.FocusEvent<HTMLTextAreaElement>;
  /**
   * 当前 ChatInput 表单节点，用于执行 contains 判定。
   */
  formElement: HTMLFormElement | null;
  /**
   * 恢复输入框焦点的回调，供上层在必要时调用。
   */
  restoreFocus: () => void;
}

export interface UseActionInputBehaviorParams {
  value: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  onVoice?: () => void;
  inputRef?: React.Ref<HTMLTextAreaElement> | null;
  placeholder?: string;
  voiceLabel?: string;
  sendLabel?: string;
  rows?: number;
  maxRows?: number;
  isRecording?: boolean;
  sourceLanguage?: LanguageValue;
  sourceLanguageOptions?: LanguageOption[];
  sourceLanguageLabel?: string;
  onSourceLanguageChange?: (value: LanguageValue) => void;
  targetLanguage?: LanguageValue;
  targetLanguageOptions?: LanguageOption[];
  targetLanguageLabel?: string;
  onTargetLanguageChange?: (value: LanguageValue) => void;
  onSwapLanguages?: () => void;
  swapLabel?: string;
  normalizeSourceLanguageFn?: (value: LanguageValue) => LanguageValue;
  normalizeTargetLanguageFn?: (value: LanguageValue) => LanguageValue;
  onMenuOpen?: () => void;
  onFocusChange?: (context: FocusChangeContext) => void;
}

export interface UseActionInputBehaviorResult {
  formProps: {
    ref: React.MutableRefObject<HTMLFormElement | null>;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  };
  textareaProps: {
    ref: (node: HTMLTextAreaElement | null) => void;
    rows: number;
    placeholder?: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onFocus: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
    onBlur: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  };
  languageControls: {
    isVisible: boolean;
    props: {
      sourceLanguage?: LanguageValue;
      sourceLanguageOptions: LanguageOption[];
      sourceLanguageLabel?: string;
      onSourceLanguageChange?: (value: LanguageValue) => void;
      targetLanguage?: LanguageValue;
      targetLanguageOptions: LanguageOption[];
      targetLanguageLabel?: string;
      onTargetLanguageChange?: (value: LanguageValue) => void;
      onSwapLanguages?: () => void;
      swapLabel?: string;
      normalizeSourceLanguage?: (value: LanguageValue) => LanguageValue;
      normalizeTargetLanguage?: (value: LanguageValue) => LanguageValue;
      onMenuOpen?: () => void;
    };
  };
  actionButtonProps: {
    value: string;
    isRecording?: boolean;
    voiceCooldownRef: React.MutableRefObject<number>;
    onVoice?: () => void;
    onSubmit: () => void;
    isVoiceDisabled: boolean;
    sendLabel: string;
    voiceLabel: string;
    restoreFocus: () => void;
  };
  /**
   * 外部辅助调用，用于在其他行为（如按钮点击）后重新聚焦输入框。
   */
  restoreFocus: () => void;
}

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

const normalizeOptions = (options?: LanguageOption[]): LanguageOption[] =>
  Array.isArray(options) ? options : [];

export default function useActionInputBehavior({
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
  normalizeSourceLanguageFn = (language) => language,
  normalizeTargetLanguageFn = (language) => language,
  onMenuOpen,
  onFocusChange,
}: UseActionInputBehaviorParams): UseActionInputBehaviorResult {
  const formRef = useRef<HTMLFormElement | null>(null);
  const internalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const voiceCooldownRef = useRef<number>(0);

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
    const textarea = internalTextareaRef.current;
    if (!textarea) {
      return;
    }
    if (typeof textarea.focus === "function") {
      textarea.focus({ preventScroll: true });
    }
  }, []);

  const setTextareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      internalTextareaRef.current = node;
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
   * 意图：在提交触发时主动释放输入焦点，驱动底部面板回落至释义模式。
   * 输入：依赖内部 textarea 引用。
   * 输出：若存在 textarea，调用其 blur 方法。
   * 流程：
   *  1) 读取内部 textarea；
   *  2) 若具备 blur 能力则执行以触发 onBlur 链路；
   * 错误处理：节点缺失或不具备 blur 时静默退化；
   * 复杂度：O(1)。
   */
  const releaseFocusForSubmission = useCallback(() => {
    const textarea = internalTextareaRef.current;
    if (!textarea || typeof textarea.blur !== "function") {
      return;
    }
    textarea.blur();
  }, []);

  const autoResize = useCallback(
    (element: HTMLTextAreaElement) => {
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
    if (internalTextareaRef.current) {
      autoResize(internalTextareaRef.current);
    }
  }, [autoResize, value]);

  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLTextAreaElement>) => {
      onFocusChange?.({
        isFocused: true,
        event,
        formElement: formRef.current,
        restoreFocus,
      });
    },
    [onFocusChange, restoreFocus],
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLTextAreaElement>) => {
      onFocusChange?.({
        isFocused: false,
        event,
        formElement: formRef.current,
        restoreFocus,
      });
    },
    [onFocusChange, restoreFocus],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      autoResize(event.target);
      onChange?.(event);
    },
    [autoResize, onChange],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (value.trim() === "") {
        return;
      }
      /**
       * 背景：仅依赖 useBottomPanelState 的文本侦测无法立即切换释义模式；
       * 取舍：提交时直接触发 blur 以沿既有 onFocusChange 通道进入 actions，
       *       避免在多个层级重复维护模式切换逻辑。
       */
      releaseFocusForSubmission();
      onSubmit?.(event);
    },
    [onSubmit, releaseFocusForSubmission, value],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    },
    [],
  );

  const handleActionSubmit = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  const languageOptions = useMemo(
    () => ({
      source: normalizeOptions(sourceLanguageOptions),
      target: normalizeOptions(targetLanguageOptions),
    }),
    [sourceLanguageOptions, targetLanguageOptions],
  );

  const isVoiceDisabled = typeof onVoice !== "function";
  const isLanguageControlsVisible =
    languageOptions.source.length > 0 || languageOptions.target.length > 0;
  return {
    formProps: {
      ref: formRef,
      onSubmit: handleSubmit,
    },
    textareaProps: {
      ref: setTextareaRef,
      rows,
      placeholder,
      value,
      onChange: handleChange,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
    },
    languageControls: {
      isVisible: isLanguageControlsVisible,
      props: {
        sourceLanguage,
        sourceLanguageOptions: languageOptions.source,
        sourceLanguageLabel,
        onSourceLanguageChange,
        targetLanguage,
        targetLanguageOptions: languageOptions.target,
        targetLanguageLabel,
        onTargetLanguageChange,
        onSwapLanguages,
        swapLabel,
        normalizeSourceLanguage: normalizeSourceLanguageFn,
        normalizeTargetLanguage: normalizeTargetLanguageFn,
        onMenuOpen,
      },
    },
    actionButtonProps: {
      value,
      isRecording,
      voiceCooldownRef,
      onVoice,
      onSubmit: handleActionSubmit,
      isVoiceDisabled,
      sendLabel: sendLabel ?? "Send",
      voiceLabel: voiceLabel ?? "Voice",
      restoreFocus,
    },
    restoreFocus,
  };
}
