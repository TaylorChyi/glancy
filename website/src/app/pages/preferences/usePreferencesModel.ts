import type { ReactNode } from "react";
import usePreferenceSections from "./usePreferenceSections.js";
import useSectionFocusManager from "@shared/hooks/useSectionFocusManager.js";
import {
  useActiveSectionDescriptor,
  useCloseRenderer,
  useSectionSelectionHandler,
} from "./preferencesHooks.js";
import type { ActiveSectionDescriptor } from "./preferencesHooks.js";
import { usePreferencesViewProps } from "./preferencesViewProps.js";
import type {
  PreferenceSectionsModel,
  SectionFocusHelpers,
} from "./preferencesTypes.js";

type PreferencesModelInput = {
  initialSection?: string;
  renderCloseAction?: (args: { className?: string }) => ReactNode;
};

const buildSectionsState = (
  sectionsModel: PreferenceSectionsModel,
  registerHeading: SectionFocusHelpers["registerHeading"],
  onSectionSelect: (section: string) => void,
) => ({
  copy: sectionsModel.copy,
  header: sectionsModel.header,
  sections: sectionsModel.sections,
  activeSectionModel: sectionsModel.activeSection,
  activeSectionId: sectionsModel.activeSectionId,
  handleSubmit: sectionsModel.handleSubmit,
  panel: sectionsModel.panel,
  avatarEditor: sectionsModel.avatarEditor,
  feedback: sectionsModel.feedback,
  registerHeading,
  onSectionSelect,
});

const usePreferencesSectionsState = (initialSection?: string) => {
  const sectionsModel = usePreferenceSections({
    initialSectionId: initialSection,
  });

  const { captureFocusOrigin, registerHeading } = useSectionFocusManager({
    activeSectionId: sectionsModel.activeSectionId,
    headingId: sectionsModel.header.headingId,
  });

  const onSectionSelect = useSectionSelectionHandler(
    sectionsModel.handleSectionSelect,
    captureFocusOrigin,
  );

  return buildSectionsState(sectionsModel, registerHeading, onSectionSelect);
};

type PreferencesSectionsState = ReturnType<typeof usePreferencesSectionsState>;

const usePreferencesCloseRenderer = (
  renderCloseAction?: PreferencesModelInput["renderCloseAction"],
) => useCloseRenderer(renderCloseAction);

const usePreferencesActiveSection = (
  activeSection: PreferencesSectionsState["activeSectionModel"],
  panel: PreferencesSectionsState["panel"],
) => useActiveSectionDescriptor(activeSection, panel);

const usePreferencesViewPropsFromState = (
  sectionsState: PreferencesSectionsState,
  closeRenderer: ReturnType<typeof useCloseRenderer>,
  activeSection: ActiveSectionDescriptor,
) =>
  usePreferencesViewProps({
    copy: sectionsState.copy,
    header: sectionsState.header,
    sections: sectionsState.sections,
    activeSectionId: sectionsState.activeSectionId,
    handleSubmit: sectionsState.handleSubmit,
    onSectionSelect: sectionsState.onSectionSelect,
    closeRenderer,
    panel: sectionsState.panel,
    registerHeading: sectionsState.registerHeading,
    activeSection,
    avatarEditor: sectionsState.avatarEditor,
    feedback: sectionsState.feedback,
  });

export const usePreferencesModel = ({
  initialSection,
  renderCloseAction,
}: PreferencesModelInput) => {
  const sectionsState = usePreferencesSectionsState(initialSection);
  const closeRenderer = usePreferencesCloseRenderer(renderCloseAction);
  const activeSection = usePreferencesActiveSection(
    sectionsState.activeSectionModel,
    sectionsState.panel,
  );
  const viewProps = usePreferencesViewPropsFromState(
    sectionsState,
    closeRenderer,
    activeSection,
  );

  return { viewProps };
};

export default usePreferencesModel;
