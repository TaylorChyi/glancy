import { useEffect } from "react";
import MessagePopup from "@/components/ui/MessagePopup";
import Layout from "@/components/Layout";
import FavoritesView from "@/pages/App/FavoritesView.jsx";
import HistoryDisplay from "@/components/ui/HistoryDisplay";
import { DictionaryEntryView } from "@/components/ui/DictionaryEntry";
import ChatInput from "@/components/ui/ChatInput";
import ICP from "@/components/ui/ICP";
import EmptyState from "@/components/ui/EmptyState";
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
import "@/pages/App/App.css";

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
    showFavorites,
    showHistory,
    handleShowDictionary,
    handleShowFavorites,
    handleSelectHistory,
    handleSelectFavorite,
    handleUnfavorite,
    favorites,
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
    dictionaryTargetLanguageLabel,
    dictionarySourceLanguageLabel,
    dictionarySwapLanguagesLabel,
    favoritesEmptyState,
    searchEmptyState,
    chatInputPlaceholder,
    activeSidebarView,
  } = useDictionaryExperience();

  const previewContent = finalText || streamText;
  const shouldRenderEntry = entry || previewContent || loading;
  const hasDefinition = Boolean(entry);

  const {
    mode: bottomPanelMode,
    activateSearchMode,
    activateActionsMode,
    handleFocusChange: handlePanelFocusChange,
    handleScrollEscape,
  } = useBottomPanelState({ hasDefinition, text });

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

  const handleInputFocusChange = (focused) => {
    handlePanelFocusChange(focused);
    if (!focused) {
      activateActionsMode();
    }
  };

  const handleMainScroll = () => {
    handleScrollEscape();
  };

  return (
    <>
      <Layout
        sidebarProps={{
          onShowDictionary: handleShowDictionary,
          onShowFavorites: handleShowFavorites,
          onSelectHistory: handleSelectHistory,
          activeView: activeSidebarView,
        }}
        onMainMiddleScroll={handleMainScroll}
        bottomContent={
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
                    actionBarProps={dictionaryActionBarProps ?? {}}
                    onRequestSearch={handleSearchButtonClick}
                    searchButtonLabel={t?.returnToSearch || "切换到搜索输入"}
                  />
                ) : null
              }
            />
            <ICP />
          </>
        }
      >
        <div className={displayClassName}>
          {showFavorites ? (
            <FavoritesView
              favorites={favorites}
              onSelect={handleSelectFavorite}
              onUnfavorite={handleUnfavorite}
              emptyTitle={favoritesEmptyState.title}
              emptyDescription={favoritesEmptyState.description}
              emptyActionLabel={favoritesEmptyState.actionLabel}
              onEmptyAction={() => {
                handleShowDictionary();
                focusInput();
              }}
              unfavoriteLabel={favoritesEmptyState.removeLabel}
            />
          ) : showHistory ? (
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
      <MessagePopup open={popupOpen} message={popupMsg} onClose={closePopup} />
    </>
  );
}
