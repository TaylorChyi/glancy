import { useMemo } from "react";

const buildHeaderLabel = ({ label, lang }) => {
  if (label) return label;
  return lang === "zh" ? "导航" : "Navigation";
};

const buildDictionaryLabel = ({ dictionaryLabel }) => dictionaryLabel || "Glancy";

const buildLibraryLabel = ({ libraryLabel, favorites, entriesLabel }) => {
  if (libraryLabel) return libraryLabel;
  if (favorites) return favorites;
  if (entriesLabel) return entriesLabel;
  return "Library";
};

const buildHistoryLabel = ({ searchHistory, lang }) => {
  if (searchHistory) return searchHistory;
  return lang === "zh" ? "搜索记录" : "History";
};

const buildEntriesLabel = ({ entriesLabel, lang }) => {
  if (entriesLabel) return entriesLabel;
  return lang === "zh" ? "词条" : "Entries";
};

const useHeaderLabel = (label, lang) =>
  useMemo(() => buildHeaderLabel({ label, lang }), [label, lang]);

const useDictionaryLabel = (dictionaryLabel) =>
  useMemo(() => buildDictionaryLabel({ dictionaryLabel }), [dictionaryLabel]);

const useLibraryLabel = ({ libraryLabel, favorites, entriesLabel }) =>
  useMemo(
    () => buildLibraryLabel({ libraryLabel, favorites, entriesLabel }),
    [entriesLabel, favorites, libraryLabel],
  );

const useHistoryLabel = (searchHistory, lang) =>
  useMemo(() => buildHistoryLabel({ searchHistory, lang }), [lang, searchHistory]);

const useEntriesLabel = (entriesLabel, lang) =>
  useMemo(() => buildEntriesLabel({ entriesLabel, lang }), [entriesLabel, lang]);

export const useSidebarLabels = ({ t, lang }) => {
  const {
    sidebarNavigationLabel,
    primaryNavDictionaryLabel,
    primaryNavLibraryLabel,
    favorites,
    searchHistory,
    primaryNavEntriesLabel,
  } = t;

  return {
    headerLabel: useHeaderLabel(sidebarNavigationLabel, lang),
    dictionaryLabel: useDictionaryLabel(primaryNavDictionaryLabel),
    libraryLabel: useLibraryLabel({
      libraryLabel: primaryNavLibraryLabel,
      favorites,
      entriesLabel: primaryNavEntriesLabel,
    }),
    historyLabel: useHistoryLabel(searchHistory, lang),
    entriesLabel: useEntriesLabel(primaryNavEntriesLabel, lang),
  };
};

export default useSidebarLabels;
