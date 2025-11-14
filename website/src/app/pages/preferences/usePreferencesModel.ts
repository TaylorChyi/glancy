import type { ReactNode } from "react";
import usePreferenceSections from "./usePreferenceSections.js";
import useSectionFocusManager from "@shared/hooks/useSectionFocusManager.js";
import {
  useActiveSectionDescriptor,
  useCloseRenderer,
  useSectionSelectionHandler,
} from "./preferencesHooks.js";
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

export const usePreferencesModel = ({
  initialSection,
  renderCloseAction,
}: PreferencesModelInput) => {
  const {
    copy,
    header,
    sections,
    activeSectionModel,
    activeSectionId,
    handleSubmit,
    panel,
    avatarEditor,
    feedback,
    registerHeading,
    onSectionSelect,
  } = usePreferencesSectionsState(initialSection);
  const closeRenderer = useCloseRenderer(renderCloseAction);
  const activeSection = useActiveSectionDescriptor(activeSectionModel, panel);
  return {
    viewProps: usePreferencesViewProps({
      copy,
      header,
      sections,
      activeSectionId,
      handleSubmit,
      onSectionSelect,
      closeRenderer,
      panel,
      registerHeading,
      activeSection,
      avatarEditor,
      feedback,
    }),
  };
};

export default usePreferencesModel;
