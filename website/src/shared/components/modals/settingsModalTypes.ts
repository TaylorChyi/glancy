import type usePreferenceSections from "@app/pages/preferences/usePreferenceSections.js";
import type useSectionFocusManager from "@shared/hooks/useSectionFocusManager.js";

export type PreferenceSectionsData = ReturnType<typeof usePreferenceSections>;
export type PanelData = PreferenceSectionsData["panel"];
export type HeaderData = PreferenceSectionsData["header"];
export type CopyData = PreferenceSectionsData["copy"];
export type SectionsData = PreferenceSectionsData["sections"];
export type ActiveSection = PreferenceSectionsData["activeSection"];
export type ActiveSectionId = PreferenceSectionsData["activeSectionId"];
export type HandleSectionSelectArg = Parameters<
  PreferenceSectionsData["handleSectionSelect"]
>[0];
export type SubmitHandler = PreferenceSectionsData["handleSubmit"];
export type AvatarEditorProps =
  PreferenceSectionsData["avatarEditor"] extends {
    modalProps: infer Props;
  }
    ? Props
    : undefined;
export type ToastProps = PreferenceSectionsData["feedback"] extends {
  redeemToast: infer Props;
}
  ? Props
  : undefined;
export type FocusManager = ReturnType<typeof useSectionFocusManager>;
export type RegisterHeading = FocusManager["registerHeading"];
export type CaptureFocusOrigin = FocusManager["captureFocusOrigin"];

export type ModalMetadata = {
  headingId?: string;
  descriptionId?: string;
  closeLabel: string;
  fallbackHeadingId?: string;
  fallbackHeadingText: string;
  sectionHeadingId?: string;
  sectionDescriptionId?: string;
  shouldRenderFallbackHeading: boolean;
};

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  className: string;
  closeLabel: string;
  hideDefaultCloseButton: boolean;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
};

export type ViewportProps = {
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

export type FormProps = {
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

export type CloseAction = {
  label: string;
  onClose: () => void;
};

export type ViewProps = {
  modal: ModalProps;
  viewport: ViewportProps;
  form: FormProps;
  avatarEditor?: AvatarEditorProps;
  toast?: ToastProps;
  closeAction: CloseAction;
};

export type SettingsModalModelInput = {
  open: boolean;
  onClose: () => void;
  initialSection?: string;
};
