import type {
  LanguageValue,
  UseActionInputBehaviorParams,
  UseActionInputBehaviorResult,
} from "./useActionInputBehavior.types";
import { useActionButtonConfig } from "./useActionButtonConfig";
import { useFocusChangeHandlers } from "./useFocusChangeHandlers";
import { useLanguageActions } from "./useLanguageActions";
import { useLanguageControlsConfig } from "./useLanguageControlsConfig";
import { useSubmissionHandlers } from "./useSubmissionHandlers";
import { useTextareaAutoResize } from "./useTextareaAutoResize";
import { useTextareaChangeHandler } from "./useTextareaChangeHandler";
import {
  UseTextareaFocusBridgeResult,
  useTextareaFocusBridge,
} from "./useTextareaFocusBridge";
import { useTextareaProps } from "./useTextareaProps";

const identityLanguage = (language: LanguageValue) => language;

type NormalizedParams = Omit<
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

const normalizeParams = (
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

const buildLanguageControlsConfigParams = (config: NormalizedParams) => ({
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

const buildLanguageActionsParams = (config: NormalizedParams) => ({
  onSourceLanguageChange: config.onSourceLanguageChange,
  onTargetLanguageChange: config.onTargetLanguageChange,
  onSwapLanguages: config.onSwapLanguages,
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
    onSubmit: ActionButtonProps["onSubmit"];
    restoreFocus: ActionButtonProps["restoreFocus"];
  },
) => ({
  value: config.value,
  onSubmit: deps.onSubmit,
  sendLabel: config.sendLabel,
  restoreFocus: deps.restoreFocus,
});

type TextareaHandlersDeps = {
  config: NormalizedParams;
  focusBridge: UseTextareaFocusBridgeResult;
};

const useTextareaHandlers = ({
  config,
  focusBridge,
}: TextareaHandlersDeps) => {
  const { textareaRef, formRef, restoreFocus } = focusBridge;
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

  return { changeHandler, focusHandlers };
};

const useLanguageControlsState = (
  config: NormalizedParams,
): UseActionInputBehaviorResult["languageControls"] => {
  const languageConfig = useLanguageControlsConfig(
    buildLanguageControlsConfigParams(config),
  );
  const languageActions = useLanguageActions(
    buildLanguageActionsParams(config),
  );

  return {
    isVisible: languageConfig.isVisible,
    props: {
      ...languageConfig.props,
      ...languageActions,
    },
  };
};

export default function useActionInputBehavior(
  params: UseActionInputBehaviorParams,
): UseActionInputBehaviorResult {
  const config = normalizeParams(params);
  const focusBridge = useTextareaFocusBridge({ inputRef: config.inputRef });
  const textareaHandlers = useTextareaHandlers({
    config,
    focusBridge,
  });

  const submissionHandlers = useSubmissionHandlers({
    value: config.value,
    onSubmit: config.onSubmit,
    formRef: focusBridge.formRef,
    releaseFocus: focusBridge.releaseFocus,
  });
  const textareaProps = useTextareaProps(
    buildTextareaPropsParams(config, {
      setTextareaRef: focusBridge.setTextareaRef,
      onChange: textareaHandlers.changeHandler,
      onKeyDown: submissionHandlers.onTextareaKeyDown,
      onFocus: textareaHandlers.focusHandlers.onFocus,
      onBlur: textareaHandlers.focusHandlers.onBlur,
    }),
  );
  const actionButtonProps = useActionButtonConfig(
    buildActionButtonParams(config, {
      onSubmit: submissionHandlers.onActionSubmit,
      restoreFocus: focusBridge.restoreFocus,
    }),
  );
  const languageControls = useLanguageControlsState(config);

  return {
    formProps: submissionHandlers.formProps,
    textareaProps,
    languageControls,
    actionButtonProps,
    restoreFocus: focusBridge.restoreFocus,
  };
}

export type {
  FocusChangeContext,
  LanguageOption,
  LanguageValue,
  UseActionInputBehaviorParams,
  UseActionInputBehaviorResult,
} from "./useActionInputBehavior.types";
