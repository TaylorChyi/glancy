import { useEffect, useMemo } from "react";
import type { RefObject, FocusEvent } from "react";
import useBottomPanelState, {
  PANEL_MODE_SEARCH,
} from "../hooks/useBottomPanelState";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../dictionaryExperienceViews.js";

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

const createInputFocusChangeHandler =
  ({
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

const shouldRenderDictionaryEntry = ({
  viewState,
  entry,
  finalText,
  loading,
}: {
  viewState: { isDictionary: boolean };
  entry?: { term?: string };
  finalText?: string;
  loading?: boolean;
}) => viewState.isDictionary && (entry || finalText || loading);

type LayoutHookArgs = {
  viewState: Record<string, any>;
  activeView: string | undefined;
  handleShowDictionary: () => void;
  handleShowLibrary: () => void;
  handleSelectHistory: (identifier: unknown) => void;
  bottomPanelState: ReturnType<typeof useBottomPanelState>;
  displayClassName: string | undefined;
  libraryLandingLabel: string | undefined;
  focusInput: () => void;
  entry: any;
  finalText: string | undefined;
  loading: boolean | undefined;
  searchEmptyState: Record<string, unknown> | undefined;
};

export const useDictionaryLayoutViewProps = ({
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
}: LayoutHookArgs) => {
  const entryShouldRender = useMemo(
    () =>
      shouldRenderDictionaryEntry({
        viewState,
        entry,
        finalText,
        loading,
      }),
    [entry, finalText, loading, viewState],
  );

  return useMemo(
    () => ({
      displayClassName,
      layout: {
        sidebarProps: {
          onShowDictionary: handleShowDictionary,
          onShowLibrary: handleShowLibrary,
          onSelectHistory: handleSelectHistory,
          activeView: activeView ?? DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY,
        },
        onMainMiddleScroll: bottomPanelState.handleScrollEscape,
      },
      mainContent: {
        viewState,
        libraryLandingLabel,
        handleShowDictionary,
        focusInput,
        handleSelectHistory,
        shouldRenderEntry: entryShouldRender,
        entry,
        finalText,
        loading,
        searchEmptyState,
      },
    }),
    [
      activeView,
      bottomPanelState.handleScrollEscape,
      displayClassName,
      entry,
      entryShouldRender,
      focusInput,
      handleSelectHistory,
      handleShowDictionary,
      handleShowLibrary,
      libraryLandingLabel,
      loading,
      searchEmptyState,
      viewState,
      finalText,
    ],
  );
};

type BottomPanelHookArgs = {
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
  sourceLanguageOptions: any;
  targetLanguageOptions: any;
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
}: BottomPanelHookArgs) => {
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
    () => ({
      shouldRender: !viewState.isLibrary,
      props: {
        bottomPanelMode: bottomPanelState.mode,
        inputProps: {
          inputRef,
          text,
          setText,
          handleSend,
          placeholder: chatInputPlaceholder,
          sourceLanguage: dictionarySourceLanguage,
          sourceLanguageOptions,
          sourceLanguageLabel: dictionarySourceLanguageLabel,
          setSourceLanguage: setDictionarySourceLanguage,
          targetLanguage: dictionaryTargetLanguage,
          targetLanguageOptions,
          targetLanguageLabel: dictionaryTargetLanguageLabel,
          setTargetLanguage: setDictionaryTargetLanguage,
          handleSwapLanguages,
          swapLabel: dictionarySwapLanguagesLabel,
          searchButtonLabel,
        },
        actionPanelProps: dictionaryActionBarViewModel,
        hasDefinition,
        onSearchButtonClick: bottomPanelState.activateSearchMode,
        handleInputFocusChange,
      },
    }),
    [
      bottomPanelState.activateSearchMode,
      bottomPanelState.mode,
      chatInputPlaceholder,
      dictionaryActionBarViewModel,
      dictionarySourceLanguage,
      dictionarySourceLanguageLabel,
      dictionarySwapLanguagesLabel,
      dictionaryTargetLanguage,
      dictionaryTargetLanguageLabel,
      handleInputFocusChange,
      handleSend,
      handleSwapLanguages,
      hasDefinition,
      inputRef,
      searchButtonLabel,
      setDictionarySourceLanguage,
      setDictionaryTargetLanguage,
      setText,
      sourceLanguageOptions,
      targetLanguageOptions,
      text,
      viewState.isLibrary,
    ],
  );

  return { bottomPanel, bottomPanelState };
};

type ReportingHookArgs = {
  reportDialog: Record<string, any>;
  reportDialogHandlers: Record<string, any>;
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
};

export const useDictionaryReportingProps = ({
  reportDialog,
  reportDialogHandlers,
  popupConfig,
  toast,
  closeToast,
}: ReportingHookArgs) =>
  useMemo(
    () => ({
      reportPanel: {
        open: reportDialog.open,
        term: reportDialog.term,
        language: reportDialog.language,
        flavor: reportDialog.flavor,
        sourceLanguage: reportDialog.sourceLanguage,
        targetLanguage: reportDialog.targetLanguage,
        category: reportDialog.category,
        categories: reportDialog.categories ?? [],
        description: reportDialog.description,
        submitting: reportDialog.submitting,
        error: reportDialog.error ?? "",
        onClose: reportDialogHandlers.close,
        onCategoryChange: reportDialogHandlers.setCategory,
        onDescriptionChange: reportDialogHandlers.setDescription,
        onSubmit: reportDialogHandlers.submit,
      },
      feedbackHub: {
        popup: popupConfig,
        toast: toast
          ? {
              open: toast.open,
              message: toast.message,
              duration: toast.duration,
              backgroundColor: toast.backgroundColor,
              textColor: toast.textColor,
              closeLabel: toast.closeLabel,
              onClose: closeToast,
            }
          : undefined,
      },
    }),
    [closeToast, popupConfig, reportDialog, reportDialogHandlers, toast],
  );

export const useDictionaryExperienceShellModel = (props) => {
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
