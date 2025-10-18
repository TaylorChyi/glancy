/**
 * 背景：
 *  - ChatInput 行为层随着功能扩展逐渐膨胀，导致主 Hook 超出结构化 lint 限制且维护困难。
 * 目的：
 *  - 通过组合式拆分（焦点门面、自动调高策略、类型契约）压缩复杂度，同时保持调用接口稳定。
 * 关键决策与取舍：
 *  - 运用门面模式封装 ref/焦点逻辑，策略模式抽离 resize 行为，主 Hook 聚焦装配职责。
 *  - 继续暴露 normalize* 策略入参，方便上层注入不同语言处理逻辑。
 * 影响范围：
 *  - ChatInput 行为 Hook 调用者、相关测试以及语言控制面板装配逻辑。
 * 演进与TODO：
 *  - 后续若加入多模态输入，可在此延伸 actionButtonProps 组合并按需扩展策略集合。
 */
import { useRef } from "react";

import type {
  LanguageValue,
  UseActionInputBehaviorParams,
  UseActionInputBehaviorResult,
} from "./useActionInputBehavior.types";
import { useActionButtonConfig } from "./useActionButtonConfig";
import { useFocusChangeHandlers } from "./useFocusChangeHandlers";
import { useLanguageControlsConfig } from "./useLanguageControlsConfig";
import { useSubmissionHandlers } from "./useSubmissionHandlers";
import { useTextareaAutoResize } from "./useTextareaAutoResize";
import { useTextareaChangeHandler } from "./useTextareaChangeHandler";
import { useTextareaFocusBridge } from "./useTextareaFocusBridge";
import { useTextareaProps } from "./useTextareaProps";

const identityLanguage = (language: LanguageValue) => language;

type NormalizedParams = Omit<
  UseActionInputBehaviorParams,
  | "voiceLabel"
  | "sendLabel"
  | "rows"
  | "maxRows"
  | "isRecording"
  | "normalizeSourceLanguageFn"
  | "normalizeTargetLanguageFn"
> & {
  voiceLabel: string;
  sendLabel: string;
  rows: number;
  maxRows: number;
  isRecording: boolean;
  normalizeSourceLanguageFn: (value: LanguageValue) => LanguageValue;
  normalizeTargetLanguageFn: (value: LanguageValue) => LanguageValue;
};

const normalizeParams = (
  params: UseActionInputBehaviorParams,
): NormalizedParams =>
  ({
    ...params,
    voiceLabel: params.voiceLabel ?? "Voice",
    sendLabel: params.sendLabel ?? "Send",
    rows: params.rows ?? 1,
    maxRows: params.maxRows ?? 5,
    isRecording: params.isRecording ?? false,
    normalizeSourceLanguageFn:
      params.normalizeSourceLanguageFn ?? identityLanguage,
    normalizeTargetLanguageFn:
      params.normalizeTargetLanguageFn ?? identityLanguage,
  }) as NormalizedParams;

const buildLanguageControlsParams = (config: NormalizedParams) => ({
  sourceLanguage: config.sourceLanguage,
  sourceLanguageOptions: config.sourceLanguageOptions,
  sourceLanguageLabel: config.sourceLanguageLabel,
  onSourceLanguageChange: config.onSourceLanguageChange,
  targetLanguage: config.targetLanguage,
  targetLanguageOptions: config.targetLanguageOptions,
  targetLanguageLabel: config.targetLanguageLabel,
  onTargetLanguageChange: config.onTargetLanguageChange,
  onSwapLanguages: config.onSwapLanguages,
  swapLabel: config.swapLabel,
  normalizeSourceLanguageFn: config.normalizeSourceLanguageFn,
  normalizeTargetLanguageFn: config.normalizeTargetLanguageFn,
  onMenuOpen: config.onMenuOpen,
});

type TextareaPropsParams = Parameters<typeof useTextareaProps>[0];

const buildTextareaPropsParams = (
  config: NormalizedParams,
  deps: {
    setTextareaRef: TextareaPropsParams["setTextareaRef"];
    onChange: TextareaPropsParams["onChange"];
    onKeyDown: TextareaPropsParams["onKeyDown"];
    onFocus?: TextareaPropsParams["onFocus"];
    onBlur?: TextareaPropsParams["onBlur"];
  },
) => ({
  setTextareaRef: deps.setTextareaRef,
  rows: config.rows,
  placeholder: config.placeholder,
  value: config.value,
  onChange: deps.onChange,
  onKeyDown: deps.onKeyDown,
  onFocus: deps.onFocus,
  onBlur: deps.onBlur,
});

type ActionButtonProps = UseActionInputBehaviorResult["actionButtonProps"];

const buildActionButtonParams = (
  config: NormalizedParams,
  deps: {
    voiceCooldownRef: ActionButtonProps["voiceCooldownRef"];
    onSubmit: ActionButtonProps["onSubmit"];
    restoreFocus: ActionButtonProps["restoreFocus"];
  },
) => ({
  value: config.value,
  isRecording: config.isRecording,
  voiceCooldownRef: deps.voiceCooldownRef,
  onVoice: config.onVoice,
  onSubmit: deps.onSubmit,
  sendLabel: config.sendLabel,
  voiceLabel: config.voiceLabel,
  restoreFocus: deps.restoreFocus,
});

export default function useActionInputBehavior(
  params: UseActionInputBehaviorParams,
): UseActionInputBehaviorResult {
  const config = normalizeParams(params);
  const { formRef, textareaRef, setTextareaRef, restoreFocus, releaseFocus } =
    useTextareaFocusBridge({ inputRef: config.inputRef });
  const voiceCooldownRef = useRef<number>(0);

  const { resize } = useTextareaAutoResize({
    textareaRef,
    maxRows: config.maxRows,
    value: config.value,
  });
  const changeHandler = useTextareaChangeHandler({
    resize,
    onChange: config.onChange,
  });
  const focusHandlers = useFocusChangeHandlers({
    onFocusChange: config.onFocusChange,
    formRef,
    restoreFocus,
  });
  const languageControls = useLanguageControlsConfig(
    buildLanguageControlsParams(config),
  );
  const submissionHandlers = useSubmissionHandlers({
    value: config.value,
    onSubmit: config.onSubmit,
    formRef,
    releaseFocus,
  });
  const textareaProps = useTextareaProps(
    buildTextareaPropsParams(config, {
      setTextareaRef,
      onChange: changeHandler,
      onKeyDown: submissionHandlers.onTextareaKeyDown,
      onFocus: focusHandlers.onFocus,
      onBlur: focusHandlers.onBlur,
    }),
  );
  const actionButtonProps = useActionButtonConfig(
    buildActionButtonParams(config, {
      voiceCooldownRef,
      onSubmit: submissionHandlers.onActionSubmit,
      restoreFocus,
    }),
  );

  return {
    formProps: submissionHandlers.formProps,
    textareaProps,
    languageControls,
    actionButtonProps,
    restoreFocus,
  };
}

export type {
  FocusChangeContext,
  LanguageOption,
  LanguageValue,
  UseActionInputBehaviorParams,
  UseActionInputBehaviorResult,
} from "./useActionInputBehavior.types";
