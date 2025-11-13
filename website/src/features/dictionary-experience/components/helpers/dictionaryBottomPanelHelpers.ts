import type { RefObject } from "react";

import type useBottomPanelState from "../../hooks/useBottomPanelState";

type DictionaryActionBarViewModel = Record<string, unknown> | undefined;

export type BottomPanelAssemblyArgs = {
  isLibraryView: boolean;
  bottomPanelState: ReturnType<typeof useBottomPanelState>;
  dictionaryActionBarViewModel: DictionaryActionBarViewModel;
  hasDefinition: boolean;
  inputRef: RefObject<HTMLInputElement>;
  text: string;
  setText: (value: string) => void;
  handleSend: (event: unknown) => void;
  placeholder?: string;
  dictionarySourceLanguage?: string;
  dictionarySourceLanguageLabel?: string;
  setDictionarySourceLanguage: (value: string) => void;
  dictionaryTargetLanguage?: string;
  dictionaryTargetLanguageLabel?: string;
  setDictionaryTargetLanguage: (value: string) => void;
  sourceLanguageOptions: unknown;
  targetLanguageOptions: unknown;
  handleSwapLanguages: () => void;
  swapLabel?: string;
  searchButtonLabel: string;
  handleInputFocusChange: (context: unknown) => void;
};

export const buildBottomPanelModel = ({
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
}: BottomPanelAssemblyArgs) => ({
  shouldRender: !isLibraryView,
  props: {
    bottomPanelMode: bottomPanelState.mode,
    inputProps: {
      inputRef,
      text,
      setText,
      handleSend,
      placeholder,
      sourceLanguage: dictionarySourceLanguage,
      sourceLanguageOptions,
      sourceLanguageLabel: dictionarySourceLanguageLabel,
      setSourceLanguage: setDictionarySourceLanguage,
      targetLanguage: dictionaryTargetLanguage,
      targetLanguageOptions,
      targetLanguageLabel: dictionaryTargetLanguageLabel,
      setTargetLanguage: setDictionaryTargetLanguage,
      handleSwapLanguages,
      swapLabel,
      searchButtonLabel,
    },
    actionPanelProps: dictionaryActionBarViewModel,
    hasDefinition,
    onSearchButtonClick: bottomPanelState.activateSearchMode,
    handleInputFocusChange,
  },
});
