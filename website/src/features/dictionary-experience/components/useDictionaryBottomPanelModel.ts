import { useEffect, useMemo } from "react";
import type { RefObject, FocusEvent } from "react";

import useBottomPanelState, {
  PANEL_MODE_SEARCH,
} from "../hooks/useBottomPanelState";
import { buildBottomPanelModel } from "./helpers/dictionaryBottomPanelHelpers.ts";

const useDictionaryActionBarViewModel = (
  dictionaryActionBarProps: Record<string, unknown> | undefined,
  activateSearchMode: () => void,
) =>
  useMemo(() => {
    if (!dictionaryActionBarProps || typeof dictionaryActionBarProps !== "object") {
      return dictionaryActionBarProps;
    }
    const originalReoutput = dictionaryActionBarProps.onReoutput;
    if (typeof originalReoutput !== "function") {
      return dictionaryActionBarProps;
    }
    const wrappedReoutput = (...args: unknown[]) => {
      activateSearchMode();
      return originalReoutput(...args);
    };
    return { ...dictionaryActionBarProps, onReoutput: wrappedReoutput };
  }, [activateSearchMode, dictionaryActionBarProps]);

const useSearchModeAutoFocus = ({
  bottomPanelMode,
  inputRef,
  focusInput,
}: {
  bottomPanelMode: string;
  inputRef: RefObject<HTMLInputElement>;
  focusInput: () => void;
}) => {
  useEffect(() => {
    if (bottomPanelMode !== PANEL_MODE_SEARCH) return;
    if (!inputRef.current) return;
    focusInput();
  }, [bottomPanelMode, focusInput, inputRef]);
};

const createInputFocusChangeHandler = ({
  handlePanelFocusChange,
  activateActionsMode,
}: {
  handlePanelFocusChange: (context: any) => void;
  activateActionsMode: () => void;
}) =>
  (context: {
    isFocused: boolean;
    formElement?: HTMLFormElement;
    event: FocusEvent;
  }) => {
    handlePanelFocusChange(context);
    if (context.isFocused) {
      return;
    }
    const { formElement, event } = context;
    const relatedTarget = (event as FocusEvent).relatedTarget as Node | null;
    const isWithinForm = Boolean(
      formElement && relatedTarget && formElement.contains(relatedTarget),
    );
    if (!isWithinForm) {
      activateActionsMode();
    }
  };

export type UseDictionaryBottomPanelModelArgs = {
  t: Record<string, string> | undefined;
  viewState: { isDictionary: boolean; isLibrary?: boolean };
  entry: { term?: string } | null;
  finalText: string | undefined;
  text: string;
  setText: (value: string) => void;
  dictionarySourceLanguage: string | undefined;
  setDictionarySourceLanguage: (value: string) => void;
  dictionaryTargetLanguage: string | undefined;
  setDictionaryTargetLanguage: (value: string) => void;
  sourceLanguageOptions: unknown;
  targetLanguageOptions: unknown;
  handleSwapLanguages: () => void;
  handleSend: (event: any) => void;
  dictionaryActionBarProps: Record<string, unknown> | undefined;
  inputRef: RefObject<HTMLInputElement>;
  focusInput: () => void;
  dictionarySourceLanguageLabel: string | undefined;
  dictionaryTargetLanguageLabel: string | undefined;
  dictionarySwapLanguagesLabel: string | undefined;
  chatInputPlaceholder: string | undefined;
};

export const useDictionaryBottomPanelModel = ({
  t,
  viewState,
  entry,
  finalText,
  text,
  setText,
  dictionarySourceLanguage,
  setDictionarySourceLanguage,
  dictionaryTargetLanguage,
  setDictionaryTargetLanguage,
  sourceLanguageOptions,
  targetLanguageOptions,
  handleSwapLanguages,
  handleSend,
  dictionaryActionBarProps,
  inputRef,
  focusInput,
  dictionarySourceLanguageLabel,
  dictionaryTargetLanguageLabel,
  dictionarySwapLanguagesLabel,
  chatInputPlaceholder,
}: UseDictionaryBottomPanelModelArgs) => {
  const hasDefinition =
    viewState.isDictionary && Boolean(entry?.term || finalText);

  const bottomPanelState = useBottomPanelState({ hasDefinition, text });
  const dictionaryActionBarViewModel = useDictionaryActionBarViewModel(
    dictionaryActionBarProps,
    bottomPanelState.activateSearchMode,
  );

  useSearchModeAutoFocus({
    bottomPanelMode: bottomPanelState.mode,
    inputRef,
    focusInput,
  });

  const handleInputFocusChange = useMemo(
    () =>
      createInputFocusChangeHandler({
        handlePanelFocusChange: bottomPanelState.handleFocusChange,
        activateActionsMode: bottomPanelState.activateActionsMode,
      }),
    [
      bottomPanelState.activateActionsMode,
      bottomPanelState.handleFocusChange,
    ],
  );

  const searchButtonLabel = t?.returnToSearch ?? "切换到搜索输入";

  const bottomPanel = useMemo(
    () =>
      buildBottomPanelModel({
        isLibraryView: Boolean(viewState.isLibrary),
        bottomPanelState,
        dictionaryActionBarViewModel,
        hasDefinition,
        inputRef,
        text,
        setText,
        handleSend,
        placeholder: chatInputPlaceholder,
        dictionarySourceLanguage,
        dictionarySourceLanguageLabel,
        setDictionarySourceLanguage,
        dictionaryTargetLanguage,
        dictionaryTargetLanguageLabel,
        setDictionaryTargetLanguage,
        sourceLanguageOptions,
        targetLanguageOptions,
        handleSwapLanguages,
        swapLabel: dictionarySwapLanguagesLabel,
        searchButtonLabel,
        handleInputFocusChange,
      }),
    [
      viewState.isLibrary,
      bottomPanelState,
      dictionaryActionBarViewModel,
      hasDefinition,
      inputRef,
      text,
      setText,
      handleSend,
      chatInputPlaceholder,
      dictionarySourceLanguage,
      dictionarySourceLanguageLabel,
      setDictionarySourceLanguage,
      dictionaryTargetLanguage,
      dictionaryTargetLanguageLabel,
      setDictionaryTargetLanguage,
      sourceLanguageOptions,
      targetLanguageOptions,
      handleSwapLanguages,
      dictionarySwapLanguagesLabel,
      searchButtonLabel,
      handleInputFocusChange,
    ],
  );

  return { bottomPanel, bottomPanelState };
};

export default useDictionaryBottomPanelModel;
