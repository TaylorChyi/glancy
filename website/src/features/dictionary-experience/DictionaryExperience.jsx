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
import "@/pages/App/App.css";

export default function DictionaryExperience() {
  const {
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

  return (
    <>
      <Layout
        sidebarProps={{
          onShowDictionary: handleShowDictionary,
          onShowFavorites: handleShowFavorites,
          onSelectHistory: handleSelectHistory,
          activeView: activeSidebarView,
        }}
        bottomContent={
          <div className="app-bottom">
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
              dictionaryActionBarProps={dictionaryActionBarProps}
              hasDefinition={Boolean(entry)}
            />
            <ICP />
          </div>
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
              iconName="target"
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
