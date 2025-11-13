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

export default useDictionaryLayoutViewProps;
