/**
 * 背景：
 *  - useActionInputBehavior 既要服务 ChatInput 行为层，也需被测试与其他特性间接复用。
 * 目的：
 *  - 集中维护 Hook 的类型契约，拆分出语义明确的结构以便复用与演进。
 * 关键决策与取舍：
 *  - 采用显式类型文件避免主 Hook 超限，同时作为“领域语言”出口供上层引用。
 *  - 保留 symbol 与 string 混用的语言值，兼容外部策略注入。
 * 影响范围：
 *  - ChatInput 行为 Hook、相关测试与引用这些类型的功能模块。
 * 演进与TODO：
 *  - 后续若引入多模态输入，可在此拓展新的控制面板配置项。
 */
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
