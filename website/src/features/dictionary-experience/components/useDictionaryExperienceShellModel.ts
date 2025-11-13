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

  const handleInputFocusChange = createInputFocusChangeHandler({
    handlePanelFocusChange: bottomPanelState.handleFocusChange,
    activateActionsMode: bottomPanelState.activateActionsMode,
  });

  const entryShouldRender = shouldRenderDictionaryEntry({
    viewState,
    entry,
    finalText,
    loading,
  });

  const searchButtonLabel = t?.returnToSearch ?? "切换到搜索输入";

  return {
    viewProps: {
      layout: {
        sidebarProps: {
          onShowDictionary: handleShowDictionary,
          onShowLibrary: handleShowLibrary,
          onSelectHistory: handleSelectHistory,
          activeView: activeView ?? DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY,
        },
        onMainMiddleScroll: bottomPanelState.handleScrollEscape,
      },
      displayClassName,
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
      bottomPanel: {
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
      },
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
    },
  };
};

export default useDictionaryExperienceShellModel;
