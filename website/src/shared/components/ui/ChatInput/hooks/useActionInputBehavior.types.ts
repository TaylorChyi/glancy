import type React from "react";

export type LanguageValue = string | symbol | undefined;

export interface LanguageOption {
  value: string | symbol;
  label: string;
  description?: string;
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
  inputRef?: React.Ref<HTMLTextAreaElement> | null;
  placeholder?: string;
  sendLabel?: string;
  rows?: number;
  maxRows?: number;
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
  onMenuOpen?: (variant?: "source" | "target") => void;
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
      onMenuOpen?: (variant?: "source" | "target") => void;
    };
  };
  actionButtonProps: {
    canSubmit: boolean;
    onSubmit: () => void;
    sendLabel: string;
    restoreFocus: () => void;
  };
  /**
   * 外部辅助调用，用于在其他行为（如按钮点击）后重新聚焦输入框。
   */
  restoreFocus: () => void;
}
