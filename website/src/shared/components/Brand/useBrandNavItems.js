import { useCallback, useMemo } from "react";
import { BRAND_LOGO_ICON } from "@shared/utils";

function useBrandNavItems({
  t,
  brandText,
  onShowDictionary,
  onShowLibrary,
}) {
  const dictionaryLabel = t.primaryNavDictionaryLabel || brandText;
  const libraryLabel = t.primaryNavLibraryLabel || t.favorites || "Favorites";
  const entriesLabel = t.primaryNavEntriesLabel || t.termLabel || "Entries";
  const dictionaryHint =
    t.primaryNavDictionaryDescription || t.searchTitle || dictionaryLabel;
  const libraryHint =
    t.primaryNavLibraryDescription || t.favoritesEmptyTitle || libraryLabel;

  const handleDictionary = useCallback(() => {
    if (typeof onShowDictionary === "function") {
      onShowDictionary();
      return;
    }
    window.location.reload();
  }, [onShowDictionary]);

  const handleLibrary = useCallback(() => {
    if (typeof onShowLibrary === "function") {
      onShowLibrary();
    }
  }, [onShowLibrary]);

  const navItems = useMemo(
    () => [
      {
        key: "dictionary",
        label: dictionaryLabel,
        icon: BRAND_LOGO_ICON,
        iconAlt: dictionaryLabel,
        onClick: handleDictionary,
        title: dictionaryHint,
        enableActiveState: false,
      },
      {
        key: "library",
        label: libraryLabel,
        icon: "library",
        iconAlt: libraryLabel,
        onClick: handleLibrary,
        enableActiveState: true,
        title: libraryHint,
      },
    ],
    [
      dictionaryHint,
      dictionaryLabel,
      handleDictionary,
      handleLibrary,
      libraryHint,
      libraryLabel,
    ],
  );

  return {
    dictionaryLabel,
    entriesLabel,
    navItems,
  };
}

export default useBrandNavItems;
