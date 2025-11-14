import { jest } from "@jest/globals";
import { BRAND_LOGO_ICON } from "@shared/utils";
import {
  buildBrandNavItems,
  resolveBrandNavLabels,
} from "../useBrandNavItems.js";

/**
 * resolveBrandNavLabels
 */
describe("resolveBrandNavLabels", () => {
  test("GivenTranslations_WhenResolvingLabels_ThenPreferTranslationValues", () => {
    const translation = {
      primaryNavDictionaryLabel: "Dictionary",
      primaryNavLibraryLabel: "Library",
      primaryNavEntriesLabel: "Entries",
      primaryNavDictionaryDescription: "Dictionary hint",
      primaryNavLibraryDescription: "Library hint",
    };

    const labels = resolveBrandNavLabels(translation, "Brand Text");

    expect(labels).toEqual({
      dictionaryLabel: "Dictionary",
      libraryLabel: "Library",
      entriesLabel: "Entries",
      dictionaryHint: "Dictionary hint",
      libraryHint: "Library hint",
    });
  });

  test("GivenMissingTranslations_WhenResolvingLabels_ThenFallbackToDefaults", () => {
    const labels = resolveBrandNavLabels({}, "Glancy");

    expect(labels).toEqual({
      dictionaryLabel: "Glancy",
      libraryLabel: "Favorites",
      entriesLabel: "Entries",
      dictionaryHint: "Glancy",
      libraryHint: "Favorites",
    });
  });
});

/**
 * buildBrandNavItems
 */
describe("buildBrandNavItems", () => {
  test("GivenLabelsAndHandlers_WhenBuildingNavItems_ThenRespectSchema", () => {
    const handleDictionary = jest.fn();
    const handleLibrary = jest.fn();

    const navItems = buildBrandNavItems({
      dictionaryLabel: "Dictionary",
      libraryLabel: "Library",
      dictionaryHint: "Dictionary hint",
      libraryHint: "Library hint",
      handleDictionary,
      handleLibrary,
    });

    expect(navItems).toHaveLength(2);
    expect(navItems[0]).toMatchObject({
      key: "dictionary",
      label: "Dictionary",
      icon: BRAND_LOGO_ICON,
      iconAlt: "Dictionary",
      onClick: handleDictionary,
      title: "Dictionary hint",
      enableActiveState: false,
    });
    expect(navItems[1]).toMatchObject({
      key: "library",
      label: "Library",
      icon: "library",
      iconAlt: "Library",
      onClick: handleLibrary,
      title: "Library hint",
      enableActiveState: true,
    });
  });
});
