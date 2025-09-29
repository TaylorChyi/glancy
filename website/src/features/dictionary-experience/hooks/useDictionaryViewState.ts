import { useCallback, useMemo, useState } from "react";
import type { RefObject } from "react";
import type { DictionaryEntry } from "../services/dictionaryExperienceService";

type ContentState = {
  entry: DictionaryEntry;
  finalText: string;
  streamText: string;
  loading: boolean;
};

type ViewStateParams = {
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  contentState: ContentState;
};

export function useDictionaryViewState({
  inputRef,
  contentState,
}: ViewStateParams) {
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  const handleShowDictionary = useCallback(() => {
    setShowFavorites(false);
    setShowHistory(false);
    focusInput();
  }, [focusInput]);

  const handleShowFavorites = useCallback(() => {
    setShowFavorites(true);
    setShowHistory(false);
  }, []);

  const handleShowHistory = useCallback(() => {
    setShowHistory(true);
    setShowFavorites(false);
  }, []);

  const isEntryViewActive = !showFavorites && !showHistory;

  const isEmptyStateActive = useMemo(
    () =>
      !showFavorites &&
      !showHistory &&
      !contentState.entry &&
      !contentState.finalText &&
      !contentState.streamText &&
      !contentState.loading,
    [
      showFavorites,
      showHistory,
      contentState.entry,
      contentState.finalText,
      contentState.streamText,
      contentState.loading,
    ],
  );

  const displayClassName = useMemo(
    () =>
      ["display", isEmptyStateActive ? "display-empty" : ""]
        .filter(Boolean)
        .join(" "),
    [isEmptyStateActive],
  );

  const activeSidebarView = useMemo(() => {
    if (showFavorites) return "favorites" as const;
    if (showHistory) return "history" as const;
    return "dictionary" as const;
  }, [showFavorites, showHistory]);

  return {
    showFavorites,
    showHistory,
    setShowFavorites,
    setShowHistory,
    handleShowDictionary,
    handleShowFavorites,
    handleShowHistory,
    focusInput,
    isEntryViewActive,
    isEmptyStateActive,
    displayClassName,
    activeSidebarView,
  };
}
