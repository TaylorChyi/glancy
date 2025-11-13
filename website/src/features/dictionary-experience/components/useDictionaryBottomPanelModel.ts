import { useMemo } from "react";
import type { RefObject } from "react";

import useBottomPanelState from "../hooks/useBottomPanelState";
import { buildBottomPanelModel } from "./helpers/dictionaryBottomPanelHelpers.ts";
import { useDictionaryActionBarViewModel } from "./helpers/useDictionaryActionBarViewModel.ts";
import { createInputFocusChangeHandler } from "./helpers/dictionaryInputFocusHandlers.ts";
import { useDictionarySearchModeAutoFocus } from "./helpers/useDictionarySearchModeAutoFocus.ts";

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

const useDictionarySearchButtonLabel = (label: string | undefined) =>
  useMemo(() => label ?? "切换到搜索输入", [label]);

type UseDictionaryBottomPanelPropsArgs = {
  isLibraryView: boolean;
  bottomPanelState: ReturnType<typeof useBottomPanelState>;
  dictionaryActionBarViewModel: ReturnType<
    typeof useDictionaryActionBarViewModel
  >;
  hasDefinition: boolean;
  inputRef: RefObject<HTMLInputElement>;
  text: string;
  setText: (value: string) => void;
  handleSend: (event: any) => void;
  placeholder: string | undefined;
  dictionarySourceLanguage: string | undefined;
  dictionarySourceLanguageLabel: string | undefined;
  setDictionarySourceLanguage: (value: string) => void;
  dictionaryTargetLanguage: string | undefined;
  dictionaryTargetLanguageLabel: string | undefined;
  setDictionaryTargetLanguage: (value: string) => void;
  sourceLanguageOptions: unknown;
  targetLanguageOptions: unknown;
  handleSwapLanguages: () => void;
  swapLabel: string | undefined;
  searchButtonLabel: string;
  handleInputFocusChange: ReturnType<typeof createInputFocusChangeHandler>;
};

const useDictionaryBottomPanelProps = ({
  isLibraryView,
  bottomPanelState,
  dictionaryActionBarViewModel,
  hasDefinition,
  inputRef,
  text,
  setText,
  handleSend,
  placeholder,
  dictionarySourceLanguage,
  dictionarySourceLanguageLabel,
  setDictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryTargetLanguageLabel,
  setDictionaryTargetLanguage,
  sourceLanguageOptions,
  targetLanguageOptions,
  handleSwapLanguages,
  swapLabel,
  searchButtonLabel,
  handleInputFocusChange,
}: UseDictionaryBottomPanelPropsArgs) =>
  useMemo(
    () =>
      buildBottomPanelModel({
        isLibraryView,
        bottomPanelState,
        dictionaryActionBarViewModel,
        hasDefinition,
        inputRef,
        text,
        setText,
        handleSend,
        placeholder,
        dictionarySourceLanguage,
        dictionarySourceLanguageLabel,
        setDictionarySourceLanguage,
        dictionaryTargetLanguage,
        dictionaryTargetLanguageLabel,
        setDictionaryTargetLanguage,
        sourceLanguageOptions,
        targetLanguageOptions,
        handleSwapLanguages,
        swapLabel,
        searchButtonLabel,
        handleInputFocusChange,
      }),
    [
      isLibraryView,
      bottomPanelState,
      dictionaryActionBarViewModel,
      hasDefinition,
      inputRef,
      text,
      setText,
      handleSend,
      placeholder,
      dictionarySourceLanguage,
      dictionarySourceLanguageLabel,
      setDictionarySourceLanguage,
      dictionaryTargetLanguage,
      dictionaryTargetLanguageLabel,
      setDictionaryTargetLanguage,
      sourceLanguageOptions,
      targetLanguageOptions,
      handleSwapLanguages,
      swapLabel,
      searchButtonLabel,
      handleInputFocusChange,
    ],
  );

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
  const dictionaryActionBarViewModel = useDictionaryActionBarViewModel({
    dictionaryActionBarProps,
    activateSearchMode: bottomPanelState.activateSearchMode,
  });

  useDictionarySearchModeAutoFocus({
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

  const searchButtonLabel = useDictionarySearchButtonLabel(
    t?.returnToSearch,
  );

  const bottomPanel = useDictionaryBottomPanelProps({
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
  });

  return { bottomPanel, bottomPanelState };
};

export default useDictionaryBottomPanelModel;
