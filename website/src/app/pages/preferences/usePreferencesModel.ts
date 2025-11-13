import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import usePreferenceSections from "./usePreferenceSections.js";
import useSectionFocusManager from "@shared/hooks/useSectionFocusManager.js";
import styles from "./Preferences.module.css";

type PreferencesModelInput = {
  initialSection?: string;
  renderCloseAction?: (args: { className?: string }) => ReactNode;
};

type PreferenceSectionsModel = ReturnType<typeof usePreferenceSections>;
type SectionFocusHelpers = ReturnType<typeof useSectionFocusManager>;

const useCloseRenderer = (renderCloseAction?: PreferencesModelInput["renderCloseAction"]) =>
  useMemo(
    () =>
      renderCloseAction
        ? ({ className = "" } = {}) => renderCloseAction({ className })
        : undefined,
    [renderCloseAction],
  );

const useActiveSectionDescriptor = (
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

const useSectionSelectionHandler = (
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

const usePreferencesViewProps = ({
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
}: Pick<
  PreferenceSectionsModel,
  | "copy"
  | "header"
  | "sections"
  | "activeSectionId"
  | "handleSubmit"
  | "panel"
  | "avatarEditor"
  | "feedback"
> & {
  onSectionSelect: (section: string) => void;
  closeRenderer: ReturnType<typeof useCloseRenderer>;
  registerHeading: SectionFocusHelpers["registerHeading"];
  activeSection: ReturnType<typeof useActiveSectionDescriptor>;
}) =>
  useMemo(
    () => ({
      form: {
        ariaHeadingId: header.headingId,
        ariaDescriptionId: header.descriptionId,
        onSubmit: handleSubmit,
      },
      header: {
        headingId: header.headingId,
        descriptionId: header.descriptionId,
        title: copy.title,
        description: copy.description,
        planLabel: header.planLabel,
        avatarProps: { width: 56, height: 56, className: styles.avatar },
        classes: {
          container: styles.header,
          identity: styles.identity,
          identityCopy: styles["identity-copy"],
          plan: styles.plan,
          title: styles.title,
          description: styles.description,
        },
      },
      viewport: {
        sections,
        activeSectionId,
        onSectionSelect,
        tablistLabel: copy.tablistLabel,
        renderCloseAction: closeRenderer,
        referenceSectionId: "data",
        body: {
          className: styles.body,
        },
        nav: {
          classes: {
            container: styles["tabs-region"],
            action: styles["close-action"],
            nav: styles.tabs,
            button: styles.tab,
            label: styles["tab-label"],
            labelText: styles["tab-label-text"],
            icon: styles["tab-icon"],
            actionButton: styles["close-button"],
          },
        },
        panel: {
          panelId: panel.panelId,
          tabId: panel.tabId,
          headingId: panel.headingId,
          className: styles.panel,
          surfaceClassName: styles["panel-surface"],
          probeClassName: styles["panel-probe"],
        },
        onHeadingElementChange: registerHeading,
      },
      activeSection,
      avatarEditor: avatarEditor ? avatarEditor.modalProps : undefined,
      toast: feedback?.redeemToast,
    }),
    [
      activeSection,
      activeSectionId,
      avatarEditor,
      closeRenderer,
      copy.description,
      copy.tablistLabel,
      copy.title,
      feedback,
      handleSubmit,
      header.descriptionId,
      header.headingId,
      header.planLabel,
      onSectionSelect,
      panel,
      registerHeading,
      sections,
    ],
  );

const usePreferencesSectionsState = (initialSection?: string) => {
  const {
    copy,
    header,
    sections,
    activeSection: activeSectionModel,
    activeSectionId,
    handleSectionSelect,
    handleSubmit,
    panel,
    avatarEditor,
    feedback,
  } = usePreferenceSections({
    initialSectionId: initialSection,
  });

  const { captureFocusOrigin, registerHeading } = useSectionFocusManager({
    activeSectionId,
    headingId: header.headingId,
  });

  const onSectionSelect = useSectionSelectionHandler(
    handleSectionSelect,
    captureFocusOrigin,
  );

  return {
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
  };
};

export const usePreferencesModel = ({
  initialSection,
  renderCloseAction,
}: PreferencesModelInput) => {
  const { copy, header, sections, activeSectionModel, activeSectionId, handleSubmit, panel, avatarEditor, feedback, registerHeading, onSectionSelect } =
    usePreferencesSectionsState(initialSection);
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
