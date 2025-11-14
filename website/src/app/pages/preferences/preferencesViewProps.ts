import { useMemo } from "react";
import type { ReactNode } from "react";
import styles from "./Preferences.module.css";
import type {
  PreferenceSectionsModel,
  SectionFocusHelpers,
} from "./preferencesTypes.js";
import type { ActiveSectionDescriptor } from "./preferencesHooks.js";

type CloseRenderer = ((args?: { className?: string }) => ReactNode) | undefined;

const HEADER_CLASSES = {
  container: styles.header,
  identity: styles.identity,
  identityCopy: styles["identity-copy"],
  plan: styles.plan,
  title: styles.title,
  description: styles.description,
};

const NAV_CLASSES = {
  container: styles["tabs-region"],
  action: styles["close-action"],
  nav: styles.tabs,
  button: styles.tab,
  label: styles["tab-label"],
  labelText: styles["tab-label-text"],
  icon: styles["tab-icon"],
  actionButton: styles["close-button"],
};

const AVATAR_PROPS = { width: 56, height: 56, className: styles.avatar };
const VIEWPORT_BODY = { className: styles.body };

const buildFormProps = (
  header: PreferenceSectionsModel["header"],
  handleSubmit: PreferenceSectionsModel["handleSubmit"],
) => ({
  ariaHeadingId: header.headingId,
  ariaDescriptionId: header.descriptionId,
  onSubmit: handleSubmit,
});

const buildHeaderProps = (
  copy: PreferenceSectionsModel["copy"],
  header: PreferenceSectionsModel["header"],
) => ({
  headingId: header.headingId,
  descriptionId: header.descriptionId,
  title: copy.title,
  description: copy.description,
  planLabel: header.planLabel,
  avatarProps: AVATAR_PROPS,
  classes: HEADER_CLASSES,
});

const buildPanelProps = (panel: PreferenceSectionsModel["panel"]) => ({
  panelId: panel.panelId,
  tabId: panel.tabId,
  headingId: panel.headingId,
  className: styles.panel,
  surfaceClassName: styles["panel-surface"],
  probeClassName: styles["panel-probe"],
});

const buildViewportProps = ({
  sections,
  activeSectionId,
  onSectionSelect,
  copy,
  closeRenderer,
  panel,
  registerHeading,
}: {
  sections: PreferenceSectionsModel["sections"];
  activeSectionId: PreferenceSectionsModel["activeSectionId"];
  onSectionSelect: (section: string) => void;
  copy: PreferenceSectionsModel["copy"];
  closeRenderer: CloseRenderer;
  panel: PreferenceSectionsModel["panel"];
  registerHeading: SectionFocusHelpers["registerHeading"];
}) => ({
  sections,
  activeSectionId,
  onSectionSelect,
  tablistLabel: copy.tablistLabel,
  renderCloseAction: closeRenderer,
  referenceSectionId: "data",
  body: VIEWPORT_BODY,
  nav: { classes: NAV_CLASSES },
  panel: buildPanelProps(panel),
  onHeadingElementChange: registerHeading,
});

type PreferencesViewPropsInput = Pick<
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
  closeRenderer: CloseRenderer;
  registerHeading: SectionFocusHelpers["registerHeading"];
  activeSection: ActiveSectionDescriptor;
};

const buildViewProps = ({
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
}: PreferencesViewPropsInput) => ({
  form: buildFormProps(header, handleSubmit),
  header: buildHeaderProps(copy, header),
  viewport: buildViewportProps({
    sections,
    activeSectionId,
    onSectionSelect,
    copy,
    closeRenderer,
    panel,
    registerHeading,
  }),
  activeSection,
  avatarEditor: avatarEditor ? avatarEditor.modalProps : undefined,
  toast: feedback?.redeemToast,
});

export const usePreferencesViewProps = (input: PreferencesViewPropsInput) => {
  const {
    activeSection, activeSectionId,
    avatarEditor, closeRenderer,
    copy, feedback,
    handleSubmit, header,
    onSectionSelect, panel,
    registerHeading, sections,
  } = input;

  return useMemo(
    () =>
      buildViewProps({
        activeSection, activeSectionId,
        avatarEditor, closeRenderer,
        copy, feedback,
        handleSubmit, header,
        onSectionSelect, panel,
        registerHeading, sections,
      }),
    [
      activeSection, activeSectionId,
      avatarEditor, closeRenderer,
      copy.description, copy.tablistLabel,
      copy.title, feedback,
      handleSubmit, header.descriptionId,
      header.headingId, header.planLabel,
      onSectionSelect, panel,
      registerHeading, sections,
    ],
  );
};

export default usePreferencesViewProps;
