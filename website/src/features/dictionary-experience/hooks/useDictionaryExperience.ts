import { useCallback, useRef } from "react";
import { useLanguage, useFavorites, useTheme } from "@/context";
import { useDictionaryLanguageConfig } from "./useDictionaryLanguageConfig.js";
import { useDictionaryPopup } from "./useDictionaryPopup.js";
import { useDictionaryLookupController } from "./useDictionaryLookupController";
import { useDictionaryViewState } from "./useDictionaryViewState";
import { useDictionaryActions } from "./useDictionaryActions";

export function useDictionaryExperience() {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { t, lang, setLang } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();
  const { theme, setTheme } = useTheme();

  const languageConfig = useDictionaryLanguageConfig({ t });
  const popup = useDictionaryPopup();

  const lookup = useDictionaryLookupController({
    abortRef,
    dictionarySourceLanguage: languageConfig.dictionarySourceLanguage,
    dictionaryTargetLanguage: languageConfig.dictionaryTargetLanguage,
    dictionaryFlavor: languageConfig.dictionaryFlavor,
    onError: popup.showPopup,
  });

  const view = useDictionaryViewState({
    inputRef,
    contentState: {
      entry: lookup.entry,
      finalText: lookup.finalText,
      streamText: lookup.streamText,
      loading: lookup.loading,
    },
  });

  const actions = useDictionaryActions({
    t,
    lang,
    setLang,
    theme,
    setTheme,
    inputRef,
    entry: lookup.entry,
    finalText: lookup.finalText,
    streamText: lookup.streamText,
    currentTerm: lookup.currentTerm,
    favorites,
    toggleFavorite,
    showFavorites: view.showFavorites,
    showHistory: view.showHistory,
    setText: lookup.setText,
    onDeleteHistory: lookup.handleDeleteHistory,
    onReoutput: lookup.handleReoutput,
    onNavigateVersion: lookup.handleNavigateVersion,
    versions: lookup.versions,
    activeVersionId: lookup.activeVersionId,
    isEntryViewActive: view.isEntryViewActive,
    loading: lookup.loading,
    showPopup: popup.showPopup,
    user: lookup.user,
    unfavoriteHistory: lookup.unfavoriteHistory,
  });

  const handleSend = useCallback(
    async (event: { preventDefault?: () => void }) => {
      view.handleShowDictionary();
      await lookup.handleSend(event);
    },
    [view, lookup],
  );

  const handleSelectHistory = useCallback(
    async (identifier: unknown, versionId?: string | number | null) => {
      await lookup.handleSelectHistory(identifier, versionId);
      view.handleShowDictionary();
    },
    [lookup, view],
  );

  const handleSelectFavorite = useCallback(
    async (term: string) => {
      await lookup.handleSelectHistory(term);
      view.handleShowDictionary();
    },
    [lookup, view],
  );

  return {
    inputRef,
    t,
    text: lookup.text,
    setText: lookup.setText,
    dictionarySourceLanguage: languageConfig.dictionarySourceLanguage,
    setDictionarySourceLanguage: languageConfig.setDictionarySourceLanguage,
    dictionaryTargetLanguage: languageConfig.dictionaryTargetLanguage,
    setDictionaryTargetLanguage: languageConfig.setDictionaryTargetLanguage,
    sourceLanguageOptions: languageConfig.sourceLanguageOptions,
    targetLanguageOptions: languageConfig.targetLanguageOptions,
    handleSwapLanguages: languageConfig.handleSwapLanguages,
    handleSend,
    handleVoice: actions.handleVoice,
    showFavorites: view.showFavorites,
    showHistory: view.showHistory,
    handleShowDictionary: view.handleShowDictionary,
    handleShowFavorites: view.handleShowFavorites,
    handleSelectHistory,
    handleSelectFavorite,
    handleUnfavorite: actions.handleUnfavorite,
    favorites: actions.favorites,
    focusInput: view.focusInput,
    entry: lookup.entry,
    finalText: lookup.finalText,
    streamText: lookup.streamText,
    loading: lookup.loading,
    dictionaryActionBarProps: actions.dictionaryActionBarProps,
    displayClassName: view.displayClassName,
    isEmptyStateActive: view.isEmptyStateActive,
    popupOpen: popup.popupOpen,
    popupMsg: popup.popupMsg,
    closePopup: popup.closePopup,
    handleCopy: actions.handleCopy,
    canCopyDefinition: actions.canCopyDefinition,
    lang,
    dictionaryFlavor: languageConfig.dictionaryFlavor,
    dictionaryTargetLanguageLabel: t.dictionaryTargetLanguageLabel,
    dictionarySourceLanguageLabel: t.dictionarySourceLanguageLabel,
    dictionarySwapLanguagesLabel: t.dictionarySwapLanguages,
    favoritesEmptyState: {
      title: t.favoritesEmptyTitle,
      description: t.favoritesEmptyDescription,
      actionLabel: t.favoritesEmptyAction,
      removeLabel: t.favoriteRemove,
    },
    searchEmptyState: {
      title: t.searchEmptyTitle,
      description: t.searchEmptyDescription,
    },
    chatInputPlaceholder: t.inputPlaceholder,
    activeSidebarView: view.activeSidebarView,
    view,
    lookup,
    actions,
    popup,
  };
}
