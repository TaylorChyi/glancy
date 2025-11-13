import { useEffect, useMemo } from "react";
import Layout from "@shared/components/Layout";
import HistoryDisplay from "@shared/components/ui/HistoryDisplay";
import { DictionaryEntryView } from "@shared/components/ui/DictionaryEntry";
import ChatInput from "@shared/components/ui/ChatInput";
import { DockedICP } from "@shared/components/ui/ICP";
import EmptyState from "@shared/components/ui/EmptyState";
import FeedbackHub from "@shared/components/ui/FeedbackHub";
import LibraryLandingView from "@app/pages/App/LibraryLandingView.jsx";
import {
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
} from "@shared/utils";
import useBottomPanelState, {
  PANEL_MODE_SEARCH,
} from "../hooks/useBottomPanelState";
import BottomPanelSwitcher from "./BottomPanelSwitcher.jsx";
import ActionPanel from "./panels/ActionPanel.jsx";
import ReportIssuePanel from "./panels/ReportIssuePanel.jsx";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../dictionaryExperienceViews.js";

const useDictionaryActionBarViewModel = (
  dictionaryActionBarProps,
  activateSearchMode,
) =>
  useMemo(() => {
    if (!dictionaryActionBarProps || typeof dictionaryActionBarProps !== "object") {
      return dictionaryActionBarProps;
    }
    const originalReoutput = dictionaryActionBarProps.onReoutput;
    if (typeof originalReoutput !== "function") {
      return dictionaryActionBarProps;
    }
    const wrappedReoutput = (...args) => {
      activateSearchMode();
      return originalReoutput(...args);
    };
    return { ...dictionaryActionBarProps, onReoutput: wrappedReoutput };
  }, [activateSearchMode, dictionaryActionBarProps]);

const useSearchModeAutoFocus = ({
  bottomPanelMode,
  inputRef,
  focusInput,
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
}) => (context) => {
  handlePanelFocusChange(context);
  if (context.isFocused) {
    return;
  }
  const { formElement, event } = context;
  const relatedTarget = event.relatedTarget;
  const isNodeTarget =
    typeof Node !== "undefined" && relatedTarget instanceof Node;
  const isWithinForm = Boolean(
    formElement && isNodeTarget && formElement.contains(relatedTarget),
  );
  if (!isWithinForm) {
    activateActionsMode();
  }
};

const shouldRenderDictionaryEntry = ({ viewState, entry, finalText, loading }) =>
  viewState.isDictionary && (entry || finalText || loading);

const DictionaryBottomPanel = ({
  bottomPanelMode,
  inputProps,
  actionPanelProps,
  hasDefinition,
  onSearchButtonClick,
  handleInputFocusChange,
}) => (
  <>
    <BottomPanelSwitcher
      mode={bottomPanelMode}
      searchContent={
        <ChatInput
          inputRef={inputProps.inputRef}
          value={inputProps.text}
          onChange={(event) => inputProps.setText(event.target.value)}
          onSubmit={inputProps.handleSend}
          placeholder={inputProps.placeholder}
          maxRows={5}
          maxWidth="var(--docker-row-max-width, var(--sb-max-width))"
          sourceLanguage={inputProps.sourceLanguage}
          sourceLanguageOptions={inputProps.sourceLanguageOptions}
          sourceLanguageLabel={inputProps.sourceLanguageLabel}
          onSourceLanguageChange={inputProps.setSourceLanguage}
          targetLanguage={inputProps.targetLanguage}
          targetLanguageOptions={inputProps.targetLanguageOptions}
          targetLanguageLabel={inputProps.targetLanguageLabel}
          onTargetLanguageChange={inputProps.setTargetLanguage}
          onSwapLanguages={inputProps.handleSwapLanguages}
          swapLabel={inputProps.swapLabel}
          normalizeSourceLanguageFn={normalizeWordSourceLanguage}
          normalizeTargetLanguageFn={normalizeWordTargetLanguage}
          onFocusChange={handleInputFocusChange}
        />
      }
      actionsContent={
        hasDefinition ? (
          <ActionPanel
            actionBarProps={actionPanelProps ?? {}}
            onRequestSearch={onSearchButtonClick}
            searchButtonLabel={inputProps.searchButtonLabel}
          />
        ) : null
      }
    />
    <DockedICP />
  </>
);

const DictionaryMainContent = ({
  viewState,
  libraryLandingLabel,
  handleShowDictionary,
  focusInput,
  handleSelectHistory,
  shouldRenderEntry,
  entry,
  finalText,
  loading,
  searchEmptyState,
}) => {
  if (viewState.isLibrary) {
    return <LibraryLandingView label={libraryLandingLabel} />;
  }
  if (viewState.isHistory) {
    return (
      <HistoryDisplay
        onEmptyAction={() => {
          handleShowDictionary();
          focusInput();
        }}
        onSelect={handleSelectHistory}
      />
    );
  }
  if (shouldRenderEntry) {
    return (
      <DictionaryEntryView entry={entry} preview={finalText} isLoading={loading} />
    );
  }
  return (
    <EmptyState
      tone="plain"
      title={searchEmptyState.title}
      description={searchEmptyState.description}
    />
  );
};

export default function DictionaryExperienceShell(props) {
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
  const {
    mode: bottomPanelMode,
    activateSearchMode,
    activateActionsMode,
    handleFocusChange: handlePanelFocusChange,
    handleScrollEscape,
  } = useBottomPanelState({ hasDefinition, text });

  const dictionaryActionBarViewModel = useDictionaryActionBarViewModel(
    dictionaryActionBarProps,
    activateSearchMode,
  );
  useSearchModeAutoFocus({ bottomPanelMode, inputRef, focusInput });

  const handleInputFocusChange = createInputFocusChangeHandler({
    handlePanelFocusChange,
    activateActionsMode,
  });

  const handleMainScroll = () => {
    handleScrollEscape();
  };

  const handleSearchButtonClick = () => {
    activateSearchMode();
  };

  const shouldRenderEntry = shouldRenderDictionaryEntry({
    viewState,
    entry,
    finalText,
    loading,
  });

  const bottomPanelContent = (
    <DictionaryBottomPanel
      bottomPanelMode={bottomPanelMode}
      inputProps={{
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
        searchButtonLabel: t?.returnToSearch ?? "切换到搜索输入",
      }}
      actionPanelProps={dictionaryActionBarViewModel}
      hasDefinition={hasDefinition}
      onSearchButtonClick={handleSearchButtonClick}
      handleInputFocusChange={handleInputFocusChange}
    />
  );

  return (
    <>
      <Layout
        sidebarProps={{
          onShowDictionary: handleShowDictionary,
          onShowLibrary: handleShowLibrary,
          onSelectHistory: handleSelectHistory,
          activeView: activeView ?? DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY,
        }}
        onMainMiddleScroll={handleMainScroll}
        bottomContent={viewState.isLibrary ? null : bottomPanelContent}
      >
        <div className={displayClassName}>
          <DictionaryMainContent
            viewState={viewState}
            libraryLandingLabel={libraryLandingLabel}
            handleShowDictionary={handleShowDictionary}
            focusInput={focusInput}
            handleSelectHistory={handleSelectHistory}
            shouldRenderEntry={shouldRenderEntry}
            entry={entry}
            finalText={finalText}
            loading={loading}
            searchEmptyState={searchEmptyState}
          />
        </div>
      </Layout>
      <ReportIssuePanel
        open={reportDialog.open}
        term={reportDialog.term}
        language={reportDialog.language}
        flavor={reportDialog.flavor}
        sourceLanguage={reportDialog.sourceLanguage}
        targetLanguage={reportDialog.targetLanguage}
        category={reportDialog.category}
        categories={reportDialog.categories ?? []}
        description={reportDialog.description}
        submitting={reportDialog.submitting}
        error={reportDialog.error ?? ""}
        onClose={reportDialogHandlers.close}
        onCategoryChange={reportDialogHandlers.setCategory}
        onDescriptionChange={reportDialogHandlers.setDescription}
        onSubmit={reportDialogHandlers.submit}
      />
      <FeedbackHub
        popup={popupConfig}
        toast={
          toast
            ? {
                open: toast.open,
                message: toast.message,
                duration: toast.duration,
                backgroundColor: toast.backgroundColor,
                textColor: toast.textColor,
                closeLabel: toast.closeLabel,
                onClose: closeToast,
              }
            : undefined
        }
      />
    </>
  );
}
