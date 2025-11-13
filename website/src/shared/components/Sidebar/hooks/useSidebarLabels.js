import { useMemo } from "react";

const buildHeaderLabel = ({ t, lang }) => {
  if (t.sidebarNavigationLabel) return t.sidebarNavigationLabel;
  return lang === "zh" ? "导航" : "Navigation";
};

const buildDictionaryLabel = ({ t }) =>
  t.primaryNavDictionaryLabel || "Glancy";

const buildLibraryLabel = ({ t }) => {
  if (t.primaryNavLibraryLabel) return t.primaryNavLibraryLabel;
  if (t.favorites) return t.favorites;
  if (t.primaryNavEntriesLabel) return t.primaryNavEntriesLabel;
  return "Library";
};

const buildHistoryLabel = ({ t, lang }) => {
  if (t.searchHistory) return t.searchHistory;
  return lang === "zh" ? "搜索记录" : "History";
};

const buildEntriesLabel = ({ t, lang }) => {
  if (t.primaryNavEntriesLabel) return t.primaryNavEntriesLabel;
  return lang === "zh" ? "词条" : "Entries";
};

export const useSidebarLabels = ({ t, lang }) => {
  const headerLabel = useMemo(
    () => buildHeaderLabel({ t, lang }),
    [lang, t.sidebarNavigationLabel],
  );
  const dictionaryLabel = useMemo(
    () => buildDictionaryLabel({ t }),
    [t.primaryNavDictionaryLabel],
  );
  const libraryLabel = useMemo(
    () => buildLibraryLabel({ t }),
    [t.favorites, t.primaryNavEntriesLabel, t.primaryNavLibraryLabel],
  );
  const historyLabel = useMemo(
    () => buildHistoryLabel({ t, lang }),
    [lang, t.searchHistory],
  );
  const entriesLabel = useMemo(
    () => buildEntriesLabel({ t, lang }),
    [lang, t.primaryNavEntriesLabel],
  );

  return {
    headerLabel,
    dictionaryLabel,
    libraryLabel,
    historyLabel,
    entriesLabel,
  };
};

export default useSidebarLabels;
