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

type SidebarPropsBuilderArgs = Pick<
  CreateDictionaryLayoutViewPropsArgs,
  | "handleShowDictionary"
  | "handleShowLibrary"
  | "handleSelectHistory"
  | "activeView"
>;

const buildSidebarProps = ({
  handleShowDictionary,
  handleShowLibrary,
  handleSelectHistory,
  activeView,
}: SidebarPropsBuilderArgs) => ({
  onShowDictionary: handleShowDictionary,
  onShowLibrary: handleShowLibrary,
  onSelectHistory: handleSelectHistory,
  activeView: activeView ?? DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY,
});

type MainContentBuilderArgs = Pick<
  CreateDictionaryLayoutViewPropsArgs,
  | "viewState"
  | "libraryLandingLabel"
  | "handleShowDictionary"
  | "focusInput"
  | "handleSelectHistory"
  | "entryShouldRender"
  | "entry"
  | "finalText"
  | "loading"
  | "searchEmptyState"
>;

const buildMainContentProps = ({
  viewState,
  libraryLandingLabel,
  handleShowDictionary,
  focusInput,
  handleSelectHistory,
  entryShouldRender,
  entry,
  finalText,
  loading,
  searchEmptyState,
}: MainContentBuilderArgs) => ({
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
});

type LayoutBuilderArgs = Pick<
  CreateDictionaryLayoutViewPropsArgs,
  | "handleShowDictionary"
  | "handleShowLibrary"
  | "handleSelectHistory"
  | "activeView"
  | "handleScrollEscape"
>;

const buildLayoutProps = ({
  handleShowDictionary,
  handleShowLibrary,
  handleSelectHistory,
  activeView,
  handleScrollEscape,
}: LayoutBuilderArgs) => ({
  sidebarProps: buildSidebarProps({
    handleShowDictionary,
    handleShowLibrary,
    handleSelectHistory,
    activeView,
  }),
  onMainMiddleScroll: handleScrollEscape,
});

export const createDictionaryLayoutViewProps = ({
  displayClassName,
  ...rest
}: CreateDictionaryLayoutViewPropsArgs) => ({
  displayClassName,
  layout: buildLayoutProps(rest),
  mainContent: buildMainContentProps(rest),
});

const useEntryShouldRender = ({
  viewState,
  entry,
  finalText,
  loading,
}: Pick<
  UseDictionaryLayoutViewPropsArgs,
  "viewState" | "entry" | "finalText" | "loading"
>) =>
  useMemo(
    () =>
      shouldRenderDictionaryEntry({
        viewState,
        entry: entry as { term?: string } | null,
        finalText,
        loading,
      }),
    [entry, finalText, loading, viewState],
  );

export const useDictionaryLayoutViewProps = (
  args: UseDictionaryLayoutViewPropsArgs,
) => {
  const { bottomPanelState, activeView, handleShowDictionary, handleShowLibrary, handleSelectHistory } = args;
  const {
    displayClassName,
    libraryLandingLabel,
    focusInput,
    entry,
    finalText,
    loading,
    searchEmptyState,
    viewState,
  } = args;
  const entryShouldRender = useEntryShouldRender(args);
  return useMemo(() => createDictionaryLayoutViewProps({
    displayClassName,
    handleShowDictionary, handleShowLibrary,
    handleSelectHistory, activeView,
    handleScrollEscape: bottomPanelState.handleScrollEscape,
    viewState, libraryLandingLabel, focusInput, entry,
    finalText, loading, searchEmptyState, entryShouldRender,
  }), [
    activeView, bottomPanelState.handleScrollEscape, displayClassName, entry,
    entryShouldRender, focusInput, handleSelectHistory, handleShowDictionary,
    handleShowLibrary, libraryLandingLabel, loading, searchEmptyState,
    viewState, finalText,
  ]);
};

export default useDictionaryLayoutViewProps;
