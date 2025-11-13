import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import usePreferenceSections from "./usePreferenceSections.js";
import useSectionFocusManager from "@shared/hooks/useSectionFocusManager.js";
import styles from "./Preferences.module.css";

type PreferencesModelInput = {
  initialSection?: string;
  renderCloseAction?: (args: { className?: string }) => ReactNode;
};

export const usePreferencesModel = ({
  initialSection,
  renderCloseAction,
}: PreferencesModelInput) => {
  const {
    copy,
    header,
    sections,
    activeSection,
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

  const handleSectionSelectWithFocus = useCallback(
    (section) => {
      captureFocusOrigin();
      handleSectionSelect(section);
    },
    [captureFocusOrigin, handleSectionSelect],
  );

  const closeRenderer = useMemo(
    () =>
      renderCloseAction
        ? ({ className = "" } = {}) => renderCloseAction({ className })
        : undefined,
    [renderCloseAction],
  );

  const activeSectionDescriptor = activeSection
    ? {
        Component: activeSection.Component,
        props: {
          headingId: panel.headingId,
          descriptionId: panel.descriptionId,
          ...activeSection.componentProps,
        },
      }
    : undefined;

  return {
    viewProps: {
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
        onSectionSelect: handleSectionSelectWithFocus,
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
      activeSection: activeSectionDescriptor,
      avatarEditor: avatarEditor ? avatarEditor.modalProps : undefined,
      toast: feedback?.redeemToast,
    },
  };
};

export default usePreferencesModel;
