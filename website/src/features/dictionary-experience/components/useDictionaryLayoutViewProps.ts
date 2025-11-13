import { useMemo } from "react";

import type useBottomPanelState from "../hooks/useBottomPanelState";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../dictionaryExperienceViews.js";
import { shouldRenderDictionaryEntry } from "./helpers/dictionaryLayoutHelpers.ts";

export type UseDictionaryLayoutViewPropsArgs = {
  viewState: Record<string, any>;
  activeView: string | undefined;
  handleShowDictionary: () => void;
  handleShowLibrary: () => void;
  handleSelectHistory: (identifier: unknown) => void;
  bottomPanelState: ReturnType<typeof useBottomPanelState>;
  displayClassName: string | undefined;
  libraryLandingLabel: string | undefined;
  focusInput: () => void;
  entry: unknown;
  finalText: string | undefined;
  loading: boolean | undefined;
  searchEmptyState: Record<string, unknown> | undefined;
};

type CreateDictionaryLayoutViewPropsArgs = {
  displayClassName: string | undefined;
  handleShowDictionary: () => void;
  handleShowLibrary: () => void;
  handleSelectHistory: (identifier: unknown) => void;
  activeView: string | undefined;
  handleScrollEscape: ReturnType<typeof useBottomPanelState>["handleScrollEscape"];
  viewState: Record<string, any>;
  libraryLandingLabel: string | undefined;
  focusInput: () => void;
  entry: unknown;
  finalText: string | undefined;
  loading: boolean | undefined;
  searchEmptyState: Record<string, unknown> | undefined;
  entryShouldRender: boolean;
};

export const createDictionaryLayoutViewProps = ({
  displayClassName,
  handleShowDictionary,
  handleShowLibrary,
  handleSelectHistory,
  activeView,
  handleScrollEscape,
  viewState,
  libraryLandingLabel,
  focusInput,
  entry,
  finalText,
  loading,
  searchEmptyState,
  entryShouldRender,
}: CreateDictionaryLayoutViewPropsArgs) => ({
  displayClassName,
  layout: {
    sidebarProps: {
      onShowDictionary: handleShowDictionary,
      onShowLibrary: handleShowLibrary,
      onSelectHistory: handleSelectHistory,
      activeView: activeView ?? DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY,
    },
    onMainMiddleScroll: handleScrollEscape,
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
});

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
}: UseDictionaryLayoutViewPropsArgs) => {
  const entryShouldRender = useMemo(
    () =>
      shouldRenderDictionaryEntry({
        viewState,
        entry: entry as { term?: string } | null,
        finalText,
        loading,
      }),
    [entry, finalText, loading, viewState],
  );

  return useMemo(
    () =>
      createDictionaryLayoutViewProps({
        displayClassName,
        handleShowDictionary,
        handleShowLibrary,
        handleSelectHistory,
        activeView,
        handleScrollEscape: bottomPanelState.handleScrollEscape,
        viewState,
        libraryLandingLabel,
        focusInput,
        entry,
        finalText,
        loading,
        searchEmptyState,
        entryShouldRender,
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

export default useDictionaryLayoutViewProps;
