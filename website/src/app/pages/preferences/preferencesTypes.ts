import type usePreferenceSections from "./usePreferenceSections.js";
import type useSectionFocusManager from "@shared/hooks/useSectionFocusManager.js";

export type PreferenceSectionsModel = ReturnType<typeof usePreferenceSections>;
export type SectionFocusHelpers = ReturnType<typeof useSectionFocusManager>;
