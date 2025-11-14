import { useCallback, useMemo } from "react";
import { BRAND_LOGO_ICON } from "@shared/utils";

export function resolveBrandNavLabels(t, brandText) {
  const dictionaryLabel = t.primaryNavDictionaryLabel || brandText;
  const libraryLabel = t.primaryNavLibraryLabel || t.favorites || "Favorites";
  const entriesLabel = t.primaryNavEntriesLabel || t.termLabel || "Entries";
  const dictionaryHint =
    t.primaryNavDictionaryDescription || t.searchTitle || dictionaryLabel;
  const libraryHint =
    t.primaryNavLibraryDescription || t.favoritesEmptyTitle || libraryLabel;

  return {
    dictionaryLabel,
    libraryLabel,
    entriesLabel,
    dictionaryHint,
    libraryHint,
  };
}

export function buildBrandNavItems({
  dictionaryLabel,
  libraryLabel,
  dictionaryHint,
  libraryHint,
  handleDictionary,
  handleLibrary,
}) {
  return [
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
  ];
}

function useBrandNavItems({
  t,
  brandText,
  onShowDictionary,
  onShowLibrary,
}) {
  const labels = useMemo(() => resolveBrandNavLabels(t, brandText), [
    t,
    brandText,
  ]);
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
    () => buildBrandNavItems({ ...labels, handleDictionary, handleLibrary }),
    [labels, handleDictionary, handleLibrary],
  );
  return { dictionaryLabel: labels.dictionaryLabel, entriesLabel: labels.entriesLabel, navItems };
}

export default useBrandNavItems;
