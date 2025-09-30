/**
 * 背景：
 *  - ChatInput 的输入域同时承载文案输入、语音触发与语言选择等多重业务，过往逻辑直接耦合在展示组件中，难以扩展。
 * 目的：
 *  - 通过自定义 Hook 下沉表单行为、键盘拦截、自适应高度与动作区状态判定，解耦展示与业务。
 * 关键决策与取舍：
 *  - 采用 Hook + View 容器模式，容器负责注入依赖，Hook 专注状态计算，View 负责纯渲染，放弃继续在展示层编写副作用以提升可测性。
 * 影响范围：
 *  - ChatInput 动作输入区的交互逻辑复用方式；同时为后续新增能力（如快捷键、策略注入）预留插口。
 * 演进与TODO：
 *  - 可进一步抽象 voice 冷却策略为可配置策略对象，或将语言区显隐策略与设置中心联动。
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  MutableRefObject,
  Ref,
} from "react";

type LanguageValue = string | symbol | undefined;

type LanguageOption = {
  value: LanguageValue;
  label: string;
  description?: string;
};

type ChangeHandler = (value: LanguageValue) => void;

type MenuOpenHandler = (section: "source" | "target") => void;

export type UseActionInputBehaviorParams = {
  value: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onVoice?: () => void;
  inputRef?: Ref<HTMLTextAreaElement>;
  placeholder?: string;
  rows?: number;
  maxRows?: number;
  isRecording?: boolean;
  sendLabel: string;
  voiceLabel: string;
  sourceLanguage?: LanguageValue;
  sourceLanguageOptions?: LanguageOption[];
  sourceLanguageLabel?: string;
  onSourceLanguageChange?: ChangeHandler;
  targetLanguage?: LanguageValue;
  targetLanguageOptions?: LanguageOption[];
  targetLanguageLabel?: string;
  onTargetLanguageChange?: ChangeHandler;
  onSwapLanguages?: () => void;
  swapLabel?: string;
  normalizeSourceLanguageFn?: (value: LanguageValue) => LanguageValue;
  normalizeTargetLanguageFn?: (value: LanguageValue) => LanguageValue;
  onMenuOpen?: MenuOpenHandler;
};

type ActionVariant = "send" | "voice";

type ActionState = {
  variant: ActionVariant;
  ariaLabel: string;
  isPressed?: boolean;
  isDisabled: boolean;
  onAction: (event: ReactMouseEvent<HTMLButtonElement>) => void;
};

type LanguageState = {
  isVisible: boolean;
  props: {
    sourceLanguage?: LanguageValue;
    sourceLanguageOptions?: LanguageOption[];
    sourceLanguageLabel?: string;
    onSourceLanguageChange?: ChangeHandler;
    targetLanguage?: LanguageValue;
    targetLanguageOptions?: LanguageOption[];
    targetLanguageLabel?: string;
    onTargetLanguageChange?: ChangeHandler;
    onSwapLanguages?: () => void;
    swapLabel?: string;
    normalizeSourceLanguage?: (value: LanguageValue) => LanguageValue;
    normalizeTargetLanguage?: (value: LanguageValue) => LanguageValue;
    onMenuOpen?: MenuOpenHandler;
  };
};

type FormProps = {
  ref: MutableRefObject<HTMLFormElement | null>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

type TextareaProps = {
  ref: (node: HTMLTextAreaElement | null) => void;
  rows: number;
  placeholder?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
};

type UseActionInputBehaviorResult = {
  formProps: FormProps;
  textareaProps: TextareaProps;
  actionState: ActionState;
  languageState: LanguageState;
};

const ACTION_BUTTON_COOLDOWN_MS = 500;

/**
 * 意图：管理 ChatInput 表单在键盘、鼠标与语言区之间的协同行为。
 * 输入：`UseActionInputBehaviorParams` 聚合的受控属性与回调。
 * 输出：可直接绑定到 View 的 form/textarea/action/language 属性集。
 * 流程：
 *  1) 建立 textarea/form 的引用并执行自适应高度调整；
 *  2) 拦截 Enter 触发提交，同时允许 Shift+Enter 换行；
 *  3) 根据输入态判定动作按钮的 send/voice 模式并处理节流；
 *  4) 计算语言区显隐以及归一化配置。
 * 错误处理：防御性判断回调存在性，冷却窗口内忽略重复语音触发。
 * 复杂度：O(1)，仅依据当前受控值进行常量时间处理。
 */
export default function useActionInputBehavior(
  params: UseActionInputBehaviorParams,
): UseActionInputBehaviorResult {
  const {
    value,
    onChange,
    onSubmit,
    onVoice,
    inputRef,
    placeholder,
    rows = 1,
    maxRows = 5,
    isRecording = false,
    sendLabel,
    voiceLabel,
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
    normalizeSourceLanguageFn,
    normalizeTargetLanguageFn,
    onMenuOpen,
  } = params;

  const formRef = useRef<HTMLFormElement | null>(null);
  const localTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const voiceCooldownRef = useRef<number>(0);

  const assignTextareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      localTextareaRef.current = node;
      if (!inputRef) {
        return;
      }
      if (typeof inputRef === "function") {
        inputRef(node);
        return;
      }
      (inputRef as MutableRefObject<HTMLTextAreaElement | null>).current = node;
    },
    [inputRef],
  );

  const autoResize = useCallback(
    (textarea: HTMLTextAreaElement | null) => {
      if (!textarea) {
        return;
      }
      const computedLineHeight = window.getComputedStyle(textarea).lineHeight;
      const lineHeight = computedLineHeight
        ? parseFloat(computedLineHeight)
        : 20;
      const maxHeight = lineHeight * maxRows;
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    },
    [maxRows],
  );

  useEffect(() => {
    autoResize(localTextareaRef.current);
  }, [autoResize, value]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      autoResize(event.target);
      onChange?.(event);
    },
    [autoResize, onChange],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (value.trim() === "") {
        return;
      }
      onSubmit?.(event);
    },
    [onSubmit, value],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    },
    [],
  );

  const trimmedLength = useMemo(() => value.trim().length, [value]);
  const actionVariant: ActionVariant = trimmedLength > 0 ? "send" : "voice";
  const isVoiceDisabled = typeof onVoice !== "function";

  const handleAction = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (actionVariant === "send") {
        formRef.current?.requestSubmit();
        return;
      }
      if (isVoiceDisabled) {
        return;
      }
      const now = Date.now();
      if (now - voiceCooldownRef.current < ACTION_BUTTON_COOLDOWN_MS) {
        return;
      }
      voiceCooldownRef.current = now;
      onVoice?.();
    },
    [actionVariant, isVoiceDisabled, onVoice],
  );

  const languageState = useMemo<LanguageState>(() => {
    const hasSource = Array.isArray(sourceLanguageOptions)
      ? sourceLanguageOptions.length > 0
      : false;
    const hasTarget = Array.isArray(targetLanguageOptions)
      ? targetLanguageOptions.length > 0
      : false;
    const isVisible = hasSource || hasTarget;
    return {
      isVisible,
      props: {
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
        normalizeSourceLanguage: normalizeSourceLanguageFn,
        normalizeTargetLanguage: normalizeTargetLanguageFn,
        onMenuOpen,
      },
    };
  }, [
    normalizeSourceLanguageFn,
    normalizeTargetLanguageFn,
    onMenuOpen,
    onSourceLanguageChange,
    onTargetLanguageChange,
    onSwapLanguages,
    sourceLanguage,
    sourceLanguageLabel,
    sourceLanguageOptions,
    swapLabel,
    targetLanguage,
    targetLanguageLabel,
    targetLanguageOptions,
  ]);

  const actionState = useMemo<ActionState>(() => {
    const ariaLabel = actionVariant === "send" ? sendLabel : voiceLabel;
    return {
      variant: actionVariant,
      ariaLabel,
      isPressed: actionVariant === "voice" ? Boolean(isRecording) : undefined,
      isDisabled: actionVariant === "voice" ? isVoiceDisabled : false,
      onAction: handleAction,
    };
  }, [
    actionVariant,
    handleAction,
    isRecording,
    isVoiceDisabled,
    sendLabel,
    voiceLabel,
  ]);

  return {
    formProps: {
      ref: formRef,
      onSubmit: handleSubmit,
    },
    textareaProps: {
      ref: assignTextareaRef,
      rows,
      placeholder,
      value,
      onChange: handleChange,
      onKeyDown: handleKeyDown,
    },
    actionState,
    languageState,
  };
}
