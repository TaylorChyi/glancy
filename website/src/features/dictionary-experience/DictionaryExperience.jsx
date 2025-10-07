import { useEffect, useMemo } from "react";
import MessagePopup from "@/components/ui/MessagePopup";
import Toast from "@/components/ui/Toast";
import Layout from "@/components/Layout";
import HistoryDisplay from "@/components/ui/HistoryDisplay";
import { DictionaryEntryView } from "@/components/ui/DictionaryEntry";
import ChatInput from "@/components/ui/ChatInput";
import { DockedICP } from "@/components/ui/ICP";
import EmptyState from "@/components/ui/EmptyState";
import LibraryLandingView from "@/pages/App/LibraryLandingView.jsx";
import {
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
} from "@/utils";
import { useDictionaryExperience } from "./hooks/useDictionaryExperience";
import useBottomPanelState, {
  PANEL_MODE_SEARCH,
} from "./hooks/useBottomPanelState";
import BottomPanelSwitcher from "./components/BottomPanelSwitcher.jsx";
import DictionaryActionPanel from "./components/DictionaryActionPanel.jsx";
import ReportIssueModal from "./components/ReportIssueModal.jsx";
import "@/pages/App/App.css";
import { DICTIONARY_EXPERIENCE_VIEWS } from "./dictionaryExperienceViews.js";

export default function DictionaryExperience() {
  const {
    inputRef,
    t,
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
    handleVoice,
    handleShowDictionary,
    handleShowLibrary,
    handleSelectHistory,
    activeView,
    viewState,
    focusInput,
    entry,
    finalText,
    streamText,
    loading,
    dictionaryActionBarProps,
    displayClassName,
    popupOpen,
    popupMsg,
    closePopup,
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
  } = useDictionaryExperience();

  const viewShape = viewState ?? {};
  const isDictionaryViewActive =
    viewShape.isDictionary ??
    activeView === DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY;
  const isHistoryViewActive =
    viewShape.isHistory ?? activeView === DICTIONARY_EXPERIENCE_VIEWS.HISTORY;
  const isLibraryViewActive =
    viewShape.isLibrary ?? activeView === DICTIONARY_EXPERIENCE_VIEWS.LIBRARY;

  const previewContent = finalText || streamText;
  const shouldRenderEntry =
    isDictionaryViewActive && (entry || previewContent || loading);
  const hasDefinition = isDictionaryViewActive && Boolean(entry);

  const {
    mode: bottomPanelMode,
    activateSearchMode,
    activateActionsMode,
    handleFocusChange: handlePanelFocusChange,
    handleScrollEscape,
  } = useBottomPanelState({ hasDefinition, text });

  const dictionaryActionBarViewModel = useMemo(() => {
    if (
      !dictionaryActionBarProps ||
      typeof dictionaryActionBarProps !== "object"
    ) {
      return dictionaryActionBarProps;
    }

    const originalReoutput = dictionaryActionBarProps.onReoutput;
    if (typeof originalReoutput !== "function") {
      return dictionaryActionBarProps;
    }

    /**
     * 背景：重试释义源于动作面板，但语义属于“重新触发搜索”。
     * 取舍：在此处包裹回调，统一经由底部面板状态机切回搜索模式，
     *       避免在工具栏或 Hook 内部散落切换逻辑，保持模式职责单一。
     */
    const wrappedReoutput = (...args) => {
      activateSearchMode();
      return originalReoutput(...args);
    };

    return { ...dictionaryActionBarProps, onReoutput: wrappedReoutput };
  }, [activateSearchMode, dictionaryActionBarProps]);

  useEffect(() => {
    // 当面板切回搜索模式时再聚焦输入框，确保 ChatInput 完成重新挂载。
    if (bottomPanelMode !== PANEL_MODE_SEARCH) {
      return;
    }
    if (!inputRef.current) {
      return;
    }
    focusInput();
  }, [bottomPanelMode, focusInput, inputRef]);

  const handleSearchButtonClick = () => {
    activateSearchMode();
  };

  /**
   * @param {import("@/components/ui/ChatInput/hooks/useActionInputBehavior").FocusChangeContext} context
   */
  const handleInputFocusChange = (context) => {
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
    if (isWithinForm) {
      return;
    }
    activateActionsMode();
  };

  const handleMainScroll = () => {
    handleScrollEscape();
  };

  const bottomPanelContent = (
    <>
      <BottomPanelSwitcher
        mode={bottomPanelMode}
        searchContent={
          <ChatInput
            inputRef={inputRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onSubmit={handleSend}
            onVoice={handleVoice}
            placeholder={chatInputPlaceholder}
            maxRows={5}
            maxWidth="var(--docker-row-max-width, var(--sb-max-width))"
            sourceLanguage={dictionarySourceLanguage}
            sourceLanguageOptions={sourceLanguageOptions}
            sourceLanguageLabel={dictionarySourceLanguageLabel}
            onSourceLanguageChange={setDictionarySourceLanguage}
            targetLanguage={dictionaryTargetLanguage}
            targetLanguageOptions={targetLanguageOptions}
            targetLanguageLabel={dictionaryTargetLanguageLabel}
            onTargetLanguageChange={setDictionaryTargetLanguage}
            onSwapLanguages={handleSwapLanguages}
            swapLabel={dictionarySwapLanguagesLabel}
            normalizeSourceLanguageFn={normalizeWordSourceLanguage}
            normalizeTargetLanguageFn={normalizeWordTargetLanguage}
            onFocusChange={handleInputFocusChange}
          />
        }
        actionsContent={
          hasDefinition ? (
            <DictionaryActionPanel
              actionBarProps={dictionaryActionBarViewModel ?? {}}
              onRequestSearch={handleSearchButtonClick}
              searchButtonLabel={t?.returnToSearch || "切换到搜索输入"}
            />
          ) : null
        }
      />
      <DockedICP />
    </>
  );

  return (
    <>
      <Layout
        sidebarProps={{
          onShowDictionary: handleShowDictionary,
          onShowLibrary: handleShowLibrary,
          onSelectHistory: handleSelectHistory,
          activeView,
        }}
        onMainMiddleScroll={handleMainScroll}
        bottomContent={isLibraryViewActive ? null : bottomPanelContent}
      >
        <div className={displayClassName}>
          {isLibraryViewActive ? (
            <LibraryLandingView label={libraryLandingLabel} />
          ) : isHistoryViewActive ? (
            <HistoryDisplay
              onEmptyAction={() => {
                handleShowDictionary();
                focusInput();
              }}
              onSelect={handleSelectHistory}
            />
          ) : shouldRenderEntry ? (
            <DictionaryEntryView
              entry={entry}
              preview={previewContent}
              isLoading={loading}
            />
          ) : (
            <EmptyState
              tone="plain"
              title={searchEmptyState.title}
              description={searchEmptyState.description}
            />
          )}
        </div>
      </Layout>
      <ReportIssueModal
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
      <MessagePopup open={popupOpen} message={popupMsg} onClose={closePopup} />
      <Toast
        open={toast?.open}
        message={toast?.message}
        duration={toast?.duration}
        backgroundColor={toast?.backgroundColor}
        textColor={toast?.textColor}
        closeLabel={toast?.closeLabel}
        onClose={closeToast}
      />
    </>
  );
}
