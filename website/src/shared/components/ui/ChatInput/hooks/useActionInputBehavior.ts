import type {
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
import {
  buildActionButtonParams,
  buildLanguageActionsParams,
  buildLanguageControlsConfigParams,
  buildTextareaPropsParams,
  normalizeParams,
} from "./useActionInputBehavior.helpers";
import type { NormalizedParams } from "./useActionInputBehavior.helpers";

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

type TextareaHandlers = ReturnType<typeof useTextareaHandlers>;
type SubmissionHandlers = ReturnType<typeof useSubmissionHandlers>;

type UseActionInputBehaviorResultDeps = {
  config: NormalizedParams;
  focusBridge: UseTextareaFocusBridgeResult;
  textareaHandlers: TextareaHandlers;
  submissionHandlers: SubmissionHandlers;
};

const useActionInputBehaviorResult = ({
  config,
  focusBridge,
  textareaHandlers,
  submissionHandlers,
}: UseActionInputBehaviorResultDeps): UseActionInputBehaviorResult => {
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

  return useActionInputBehaviorResult({
    config,
    focusBridge,
    textareaHandlers,
    submissionHandlers,
  });
}

export type {
  FocusChangeContext,
  LanguageOption,
  LanguageValue,
  UseActionInputBehaviorParams,
  UseActionInputBehaviorResult,
} from "./useActionInputBehavior.types";
