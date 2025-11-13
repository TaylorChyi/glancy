import type { RefObject } from "react";

import useDictionaryBottomPanelModel from "./useDictionaryBottomPanelModel.ts";
import useDictionaryLayoutViewProps from "./useDictionaryLayoutViewProps.ts";
import useDictionaryReportingProps from "./useDictionaryReportingProps.ts";

type DictionaryExperienceShellProps = {
  t: Record<string, string> | undefined;
  inputRef: RefObject<HTMLInputElement>;
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
  handleShowDictionary: () => void;
  handleShowLibrary: () => void;
  handleSelectHistory: (identifier: unknown) => void;
  viewState: Record<string, any>;
  activeView: string | undefined;
  focusInput: () => void;
  entry: any;
  finalText: string | undefined;
  loading: boolean | undefined;
  dictionaryActionBarProps: Record<string, unknown> | undefined;
  displayClassName: string | undefined;
  popupConfig: Record<string, any> | undefined;
  toast:
    | undefined
    | {
        open: boolean;
        message: string;
        duration?: number;
        backgroundColor?: string;
        textColor?: string;
        closeLabel?: string;
      };
  closeToast: (() => void) | undefined;
  dictionaryTargetLanguageLabel: string | undefined;
  dictionarySourceLanguageLabel: string | undefined;
  dictionarySwapLanguagesLabel: string | undefined;
  searchEmptyState: Record<string, unknown> | undefined;
  chatInputPlaceholder: string | undefined;
  libraryLandingLabel: string | undefined;
  reportDialog: Record<string, any>;
  reportDialogHandlers: Record<string, any>;
};

export const useDictionaryExperienceShellModel = (
  props: DictionaryExperienceShellProps,
) => {
  const {
    t,
    inputRef,
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
    handleShowDictionary,
    handleShowLibrary,
    handleSelectHistory,
    viewState,
    activeView,
    focusInput,
    entry,
    finalText,
    loading,
    dictionaryActionBarProps,
    displayClassName,
    popupConfig,
    toast,
    closeToast,
    dictionaryTargetLanguageLabel,
    dictionarySourceLanguageLabel,
    dictionarySwapLanguagesLabel,
    searchEmptyState,
    chatInputPlaceholder,
    libraryLandingLabel,
    reportDialog,
    reportDialogHandlers,
  } = props;

  const { bottomPanel, bottomPanelState } = useDictionaryBottomPanelModel({
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
  });

  const layoutProps = useDictionaryLayoutViewProps({
    viewState,
    activeView,
    handleShowDictionary,
    handleShowLibrary,
    handleSelectHistory,
    bottomPanelState,
    displayClassName,
    libraryLandingLabel,
    focusInput,
    entry,
    finalText,
    loading,
    searchEmptyState,
  });

  const reportingProps = useDictionaryReportingProps({
    reportDialog,
    reportDialogHandlers,
    popupConfig,
    toast,
    closeToast,
  });

  return {
    viewProps: {
      ...layoutProps,
      bottomPanel,
      ...reportingProps,
    },
  };
};

export default useDictionaryExperienceShellModel;
