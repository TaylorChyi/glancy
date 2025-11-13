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

type PreferenceSectionsData = ReturnType<typeof usePreferenceSections>;
type PanelData = PreferenceSectionsData["panel"];
type HeaderData = PreferenceSectionsData["header"];
type CopyData = PreferenceSectionsData["copy"];
type SectionsData = PreferenceSectionsData["sections"];
type ActiveSection = PreferenceSectionsData["activeSection"];
type ActiveSectionId = PreferenceSectionsData["activeSectionId"];
type HandleSectionSelectArg = Parameters<
  PreferenceSectionsData["handleSectionSelect"]
>[0];
type SubmitHandler = PreferenceSectionsData["handleSubmit"];
type AvatarEditorProps = PreferenceSectionsData["avatarEditor"] extends {
  modalProps: infer Props;
}
  ? Props
  : undefined;
type ToastProps = PreferenceSectionsData["feedback"] extends {
  redeemToast: infer Props;
}
  ? Props
  : undefined;
type FocusManager = ReturnType<typeof useSectionFocusManager>;
type RegisterHeading = FocusManager["registerHeading"];
type CaptureFocusOrigin = FocusManager["captureFocusOrigin"];

type ModalMetadata = {
  headingId?: string;
  descriptionId?: string;
  closeLabel: string;
  fallbackHeadingId?: string;
  fallbackHeadingText: string;
  sectionHeadingId?: string;
  sectionDescriptionId?: string;
  shouldRenderFallbackHeading: boolean;
};

type ModalProps = {
  open: boolean;
  onClose: () => void;
  className: string;
  closeLabel: string;
  hideDefaultCloseButton: boolean;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
};

type ViewportProps = {
  sections: SectionsData;
  activeSectionId: ActiveSectionId;
  onSectionSelect: (section: HandleSectionSelectArg) => void;
  tablistLabel: string;
  referenceSectionId: string;
  body: {
    className: string;
  };
  nav: {
    classes: {
      container: string;
      action: string;
      nav: string;
      button: string;
      label: string;
      labelText: string;
      icon: string;
      actionButton: string;
    };
  };
  panel: {
    panelId: string;
    tabId: string;
    headingId?: string;
    className: string;
    surfaceClassName: string;
    probeClassName: string;
  };
  onHeadingElementChange: RegisterHeading;
};

type FormProps = {
  ariaHeadingId?: string;
  ariaDescriptionId?: string;
  sectionHeadingId?: string;
  sectionDescriptionId?: string;
  onSubmit: SubmitHandler;
  shouldRenderFallbackHeading: boolean;
  fallbackHeadingId?: string;
  fallbackHeadingText: string;
  registerFallbackHeading: RegisterHeading;
  activeSection: ActiveSection;
};

type CloseAction = {
  label: string;
  onClose: () => void;
};

const useModalMetadata = ({
  panel,
  header,
  copy,
}: {
  panel: PanelData;
  header: HeaderData;
  copy: CopyData;
}): ModalMetadata =>
  useMemo(
    () => ({
      headingId: panel.focusHeadingId || panel.modalHeadingId,
      descriptionId: panel.descriptionId || header.descriptionId,
      closeLabel: buildCloseLabel(copy.closeLabel, panel.modalHeadingText),
      fallbackHeadingId: panel.modalHeadingId,
      fallbackHeadingText: panel.modalHeadingText || copy.title,
      sectionHeadingId: panel.headingId || panel.modalHeadingId,
      sectionDescriptionId: panel.descriptionId,
      shouldRenderFallbackHeading: !panel.headingId,
    }),
    [
      panel.focusHeadingId,
      panel.modalHeadingId,
      panel.descriptionId,
      header.descriptionId,
      copy.closeLabel,
      panel.modalHeadingText,
      copy.title,
      panel.headingId,
    ],
  );

const useSectionSelectHandler = ({
  captureFocusOrigin,
  handleSectionSelect,
}: {
  captureFocusOrigin: CaptureFocusOrigin;
  handleSectionSelect: PreferenceSectionsData["handleSectionSelect"];
}) =>
  useCallback(
    (section: HandleSectionSelectArg) => {
      captureFocusOrigin();
      handleSectionSelect(section);
    },
    [captureFocusOrigin, handleSectionSelect],
  );

const useFallbackHeadingRegistrar = ({
  panelHeadingId,
  registerHeading,
}: {
  panelHeadingId?: string;
  registerHeading: RegisterHeading;
}) =>
  useCallback(
    (node: Parameters<RegisterHeading>[0]) => {
      if (!panelHeadingId) {
        registerHeading(node);
      }
    },
    [panelHeadingId, registerHeading],
  );

const useModalProps = ({
  open,
  onClose,
  metadata,
}: {
  open: boolean;
  onClose: () => void;
  metadata: ModalMetadata;
}): ModalProps =>
  useMemo(
    () => ({
      open,
      onClose,
      className: `${modalStyles.dialog} modal-content`,
      closeLabel: metadata.closeLabel,
      hideDefaultCloseButton: true,
      ariaLabelledBy: metadata.headingId,
      ariaDescribedBy: metadata.descriptionId,
    }),
    [
      open,
      onClose,
      metadata.closeLabel,
      metadata.headingId,
      metadata.descriptionId,
    ],
  );

const useViewportProps = ({
  sections,
  activeSectionId,
  onSectionSelect,
  tablistLabel,
  registerHeading,
  panel,
}: {
  sections: SectionsData;
  activeSectionId: ActiveSectionId;
  onSectionSelect: (section: HandleSectionSelectArg) => void;
  tablistLabel: string;
  registerHeading: RegisterHeading;
  panel: PanelData;
}): ViewportProps =>
  useMemo(
    () => ({
      sections,
      activeSectionId,
      onSectionSelect,
      tablistLabel,
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
    }),
    [
      sections,
      activeSectionId,
      onSectionSelect,
      tablistLabel,
      registerHeading,
      panel.panelId,
      panel.tabId,
      panel.headingId,
    ],
  );

const useFormProps = ({
  metadata,
  panel,
  handleSubmit,
  registerFallbackHeading,
  activeSection,
}: {
  metadata: ModalMetadata;
  panel: PanelData;
  handleSubmit: SubmitHandler;
  registerFallbackHeading: RegisterHeading;
  activeSection: ActiveSection;
}): FormProps =>
  useMemo(
    () => ({
      ariaHeadingId: metadata.headingId,
      ariaDescriptionId: metadata.descriptionId,
      sectionHeadingId: metadata.sectionHeadingId,
      sectionDescriptionId: metadata.sectionDescriptionId,
      onSubmit: handleSubmit,
      shouldRenderFallbackHeading: metadata.shouldRenderFallbackHeading,
      fallbackHeadingId: metadata.fallbackHeadingId,
      fallbackHeadingText: metadata.fallbackHeadingText,
      registerFallbackHeading,
      activeSection,
    }),
    [
      metadata.headingId,
      metadata.descriptionId,
      metadata.sectionHeadingId,
      metadata.sectionDescriptionId,
      handleSubmit,
      metadata.shouldRenderFallbackHeading,
      metadata.fallbackHeadingId,
      metadata.fallbackHeadingText,
      registerFallbackHeading,
      activeSection,
    ],
  );

const useCloseAction = ({
  onClose,
  closeLabel,
}: {
  onClose: () => void;
  closeLabel: string;
}): CloseAction =>
  useMemo(
    () => ({
      label: closeLabel,
      onClose,
    }),
    [closeLabel, onClose],
  );

const useViewProps = ({
  modal,
  viewport,
  form,
  avatarEditor,
  toast,
  closeAction,
}: {
  modal: ModalProps;
  viewport: ViewportProps;
  form: FormProps;
  avatarEditor?: AvatarEditorProps;
  toast?: ToastProps;
  closeAction: CloseAction;
}) =>
  useMemo(
    () => ({
      modal,
      viewport,
      form,
      avatarEditor,
      toast,
      closeAction,
    }),
    [modal, viewport, form, avatarEditor, toast, closeAction],
  );

const useSettingsViewProps = ({
  open,
  onClose,
  sectionsData,
  metadata,
  focusManager,
}: {
  open: boolean;
  onClose: () => void;
  sectionsData: PreferenceSectionsData;
  metadata: ModalMetadata;
  focusManager: FocusManager;
}) =>
  useViewProps({
    modal: useModalProps({ open, onClose, metadata }),
    viewport: useViewportProps({
      sections: sectionsData.sections,
      activeSectionId: sectionsData.activeSectionId,
      onSectionSelect: useSectionSelectHandler({
        captureFocusOrigin: focusManager.captureFocusOrigin,
        handleSectionSelect: sectionsData.handleSectionSelect,
      }),
      tablistLabel: sectionsData.copy.tablistLabel,
      registerHeading: focusManager.registerHeading,
      panel: sectionsData.panel,
    }),
    form: useFormProps({
      metadata,
      panel: sectionsData.panel,
      handleSubmit: sectionsData.handleSubmit,
      registerFallbackHeading: useFallbackHeadingRegistrar({
        panelHeadingId: sectionsData.panel.headingId,
        registerHeading: focusManager.registerHeading,
      }),
      activeSection: sectionsData.activeSection,
    }),
    avatarEditor: sectionsData.avatarEditor?.modalProps,
    toast: sectionsData.feedback?.redeemToast,
    closeAction: useCloseAction({ closeLabel: metadata.closeLabel, onClose }),
  });

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
  const sectionsData = usePreferenceSections({
    initialSectionId: initialSection,
  });

  const metadata = useModalMetadata({
    panel: sectionsData.panel,
    header: sectionsData.header,
    copy: sectionsData.copy,
  });
  const focusManager = useSectionFocusManager({
    activeSectionId: sectionsData.activeSectionId,
    headingId: metadata.headingId,
  });

  const viewProps = useSettingsViewProps({
    open,
    onClose,
    sectionsData,
    metadata,
    focusManager,
  });

  return { viewProps };
};

export default useSettingsModalModel;
