import { useCallback, useMemo } from "react";
import { usePreferenceNavigationState } from "./usePreferenceNavigationState.js";

export const usePreferenceNavigation = ({ initialSectionId, sections }) => {
  const { activeSectionId, setActiveSectionId } = usePreferenceNavigationState({
    initialSectionId,
    sections,
  });

  const activeSection = useMemo(
    () =>
      sections.find((section) => section.id === activeSectionId) ?? sections[0],
    [activeSectionId, sections],
  );

  const handleSectionSelect = useCallback(
    (section) => {
      if (!section || section.disabled) {
        return;
      }
      setActiveSectionId((current) =>
        current === section.id ? current : section.id,
      );
    },
    [setActiveSectionId],
  );

  return {
    activeSectionId,
    activeSection,
    handleSectionSelect,
    setActiveSectionId,
  };
};
