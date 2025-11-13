import { useCallback, useMemo } from "react";
import usePreferenceSections from "@app/pages/preferences/usePreferenceSections.js";
import useSectionFocusManager from "@shared/hooks/useSectionFocusManager.js";
import preferencesStyles from "@app/pages/preferences/Preferences.module.css";
import modalStyles from "./SettingsModal.module.css";

const buildCloseLabel = (baseLabel?: string, contextLabel?: string) => {
  const normalizedBase = typeof baseLabel === "string" ? baseLabel.trim() : "";
  const normalizedContext =
    typeof contextLabel === "string" ? contextLabel.trim() : "";
  if (!normalizedBase && !normalizedContext) {
    return "Close";
  }
  if (!normalizedBase) {
    return normalizedContext;
  }
  if (!normalizedContext) {
    return normalizedBase;
  }
  if (normalizedBase.toLowerCase() === normalizedContext.toLowerCase()) {
    return normalizedBase;
  }
  return `${normalizedBase} ${normalizedContext}`;
};

type SettingsModalModelInput = {
  open: boolean;
  onClose: () => void;
  initialSection?: string;
};

export const useSettingsModalModel = ({
  open,
  onClose,
  initialSection,
}: SettingsModalModelInput) => {
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

  const resolvedHeadingId = panel.focusHeadingId || panel.modalHeadingId;
  const resolvedDescriptionId = panel.descriptionId || header.descriptionId;

  const { captureFocusOrigin, registerHeading } = useSectionFocusManager({
    activeSectionId,
    headingId: resolvedHeadingId,
  });

  const handleSectionSelectWithFocus = useCallback(
    (section) => {
      captureFocusOrigin();
      handleSectionSelect(section);
    },
    [captureFocusOrigin, handleSectionSelect],
  );

  const resolvedCloseLabel = useMemo(
    () => buildCloseLabel(copy.closeLabel, panel.modalHeadingText),
    [copy.closeLabel, panel.modalHeadingText],
  );

  const registerFallbackHeading = useCallback(
    (node: HTMLElement | null) => {
      if (!panel.headingId) {
        registerHeading(node);
      }
    },
    [panel.headingId, registerHeading],
  );

  return {
    viewProps: {
      modal: {
        open,
        onClose,
        className: `${modalStyles.dialog} modal-content`,
        closeLabel: resolvedCloseLabel,
        hideDefaultCloseButton: true,
        ariaLabelledBy: resolvedHeadingId,
        ariaDescribedBy: resolvedDescriptionId,
      },
      viewport: {
        sections,
        activeSectionId,
        onSectionSelect: handleSectionSelectWithFocus,
        tablistLabel: copy.tablistLabel,
        referenceSectionId: "data",
        body: {
          className: `${preferencesStyles.body} ${modalStyles["body-region"]}`,
        },
        nav: {
          classes: {
            container: preferencesStyles["tabs-region"],
            action: preferencesStyles["close-action"],
            nav: preferencesStyles.tabs,
            button: preferencesStyles.tab,
            label: preferencesStyles["tab-label"],
            labelText: preferencesStyles["tab-label-text"],
            icon: preferencesStyles["tab-icon"],
            actionButton: preferencesStyles["close-button"],
          },
        },
        panel: {
          panelId: panel.panelId,
          tabId: panel.tabId,
          headingId: panel.headingId,
          className: preferencesStyles.panel,
          surfaceClassName: preferencesStyles["panel-surface"],
          probeClassName: preferencesStyles["panel-probe"],
        },
        onHeadingElementChange: registerHeading,
      },
      form: {
        ariaHeadingId: resolvedHeadingId,
        ariaDescriptionId: resolvedDescriptionId,
        sectionHeadingId: panel.headingId || panel.modalHeadingId,
        sectionDescriptionId: panel.descriptionId,
        onSubmit: handleSubmit,
        shouldRenderFallbackHeading: !panel.headingId,
        fallbackHeadingId: panel.modalHeadingId,
        fallbackHeadingText: panel.modalHeadingText || copy.title,
        registerFallbackHeading,
        activeSection,
      },
      avatarEditor: avatarEditor ? avatarEditor.modalProps : undefined,
      toast: feedback?.redeemToast,
      closeAction: {
        label: resolvedCloseLabel,
        onClose,
      },
    },
  };
};

export default useSettingsModalModel;
