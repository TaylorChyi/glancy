import type {
  LanguageValue,
  UseActionInputBehaviorParams,
  UseActionInputBehaviorResult,
} from "./useActionInputBehavior.types";
import type { UseTextareaPropsParams } from "./useTextareaProps";

const identityLanguage = (language: LanguageValue) => language;

export type NormalizedParams = Omit<
  UseActionInputBehaviorParams,
  | "sendLabel"
  | "rows"
  | "maxRows"
  | "normalizeSourceLanguageFn"
  | "normalizeTargetLanguageFn"
> & {
  sendLabel: string;
  rows: number;
  maxRows: number;
  normalizeSourceLanguageFn: (value: LanguageValue) => LanguageValue;
  normalizeTargetLanguageFn: (value: LanguageValue) => LanguageValue;
};

export const normalizeParams = (
  params: UseActionInputBehaviorParams,
): NormalizedParams =>
  ({
    ...params,
    sendLabel: params.sendLabel ?? "Send",
    rows: params.rows ?? 1,
    maxRows: params.maxRows ?? 5,
    normalizeSourceLanguageFn:
      params.normalizeSourceLanguageFn ?? identityLanguage,
    normalizeTargetLanguageFn:
      params.normalizeTargetLanguageFn ?? identityLanguage,
  }) as NormalizedParams;

export const buildLanguageControlsConfigParams = (config: NormalizedParams) => ({
  sourceLanguage: config.sourceLanguage,
  sourceLanguageOptions: config.sourceLanguageOptions,
  sourceLanguageLabel: config.sourceLanguageLabel,
  targetLanguage: config.targetLanguage,
  targetLanguageOptions: config.targetLanguageOptions,
  targetLanguageLabel: config.targetLanguageLabel,
  swapLabel: config.swapLabel,
  normalizeSourceLanguageFn: config.normalizeSourceLanguageFn,
  normalizeTargetLanguageFn: config.normalizeTargetLanguageFn,
});

export const buildLanguageActionsParams = (config: NormalizedParams) => ({
  onSourceLanguageChange: config.onSourceLanguageChange,
  onTargetLanguageChange: config.onTargetLanguageChange,
  onSwapLanguages: config.onSwapLanguages,
  onMenuOpen: config.onMenuOpen,
});

type TextareaPropsParams = UseTextareaPropsParams;

export const buildTextareaPropsParams = (
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

export const buildActionButtonParams = (
  config: NormalizedParams,
  deps: {
    onSubmit: ActionButtonProps["onSubmit"];
    restoreFocus: ActionButtonProps["restoreFocus"];
  },
) => ({
  value: config.value,
  onSubmit: deps.onSubmit,
  sendLabel: config.sendLabel,
  restoreFocus: deps.restoreFocus,
});
