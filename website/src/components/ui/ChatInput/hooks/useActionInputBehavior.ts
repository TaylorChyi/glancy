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

export type LanguageValue = string | symbol | undefined;

export interface LanguageOption {
  value: string | symbol;
  label: string;
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
  onFocusChange?: (isFocused: boolean) => void;
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
    onFocus: () => void;
    onBlur: () => void;
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
  };
}

const DEFAULT_LINE_HEIGHT = 20;

const getLineHeight = (element: HTMLTextAreaElement): number => {
  if (typeof window === "undefined" || typeof window.getComputedStyle !== "function") {
    return DEFAULT_LINE_HEIGHT;
  }
  const computed = window.getComputedStyle(element).lineHeight ?? `${DEFAULT_LINE_HEIGHT}`;
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
        (inputRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("ActionInput 接收到不可写入的 inputRef，已回退为内部引用。", error);
        }
      }
    },
    [inputRef],
  );

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

  const handleFocus = useCallback(() => {
    onFocusChange?.(true);
  }, [onFocusChange]);

  const handleBlur = useCallback(() => {
    onFocusChange?.(false);
  }, [onFocusChange]);

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
      onSubmit?.(event);
    },
    [onSubmit, value],
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
    },
  };
}
