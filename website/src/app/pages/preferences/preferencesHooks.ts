import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import type {
  PreferenceSectionsModel,
  SectionFocusHelpers,
} from "./preferencesTypes.js";

export const useCloseRenderer = (
  renderCloseAction?: (args: { className?: string }) => ReactNode,
) =>
  useMemo(
    () =>
      renderCloseAction
        ? ({ className = "" } = {}) => renderCloseAction({ className })
        : undefined,
    [renderCloseAction],
  );

export const useActiveSectionDescriptor = (
  activeSection: PreferenceSectionsModel["activeSection"],
  panel: PreferenceSectionsModel["panel"],
) =>
  useMemo(
    () =>
      activeSection
        ? {
            Component: activeSection.Component,
            props: {
              headingId: panel.headingId,
              descriptionId: panel.descriptionId,
              ...activeSection.componentProps,
            },
          }
        : undefined,
    [activeSection, panel.descriptionId, panel.headingId],
  );

export const useSectionSelectionHandler = (
  handleSectionSelect: PreferenceSectionsModel["handleSectionSelect"],
  captureFocusOrigin: SectionFocusHelpers["captureFocusOrigin"],
) =>
  useCallback(
    (section: string) => {
      captureFocusOrigin();
      handleSectionSelect(section);
    },
    [captureFocusOrigin, handleSectionSelect],
  );

export type ActiveSectionDescriptor = ReturnType<
  typeof useActiveSectionDescriptor
>;
