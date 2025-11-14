import { useCallback } from "react";
import useCloseAction from "./hooks/useCloseAction";
import useFormProps from "./hooks/useFormProps";
import useModalProps from "./hooks/useModalProps";
import useViewProps from "./hooks/useViewProps";
import useViewportProps from "./hooks/useViewportProps";
import type {
  FocusManager,
  ModalMetadata,
  PreferenceSectionsData,
  RegisterHeading,
  HandleSectionSelectArg,
} from "./settingsModalTypes";

const useSectionSelectHandler = ({
  captureFocusOrigin,
  handleSectionSelect,
}: {
  captureFocusOrigin: FocusManager["captureFocusOrigin"];
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

const useSettingsViewport = ({
  sectionsData,
  focusManager,
}: {
  sectionsData: PreferenceSectionsData;
  focusManager: FocusManager;
}) => {
  const sectionSelectHandler = useSectionSelectHandler({
    captureFocusOrigin: focusManager.captureFocusOrigin,
    handleSectionSelect: sectionsData.handleSectionSelect,
  });

  return useViewportProps({
    sections: sectionsData.sections,
    activeSectionId: sectionsData.activeSectionId,
    onSectionSelect: sectionSelectHandler,
    tablistLabel: sectionsData.copy.tablistLabel,
    registerHeading: focusManager.registerHeading,
    panel: sectionsData.panel,
  });
};

const useSettingsForm = ({
  sectionsData,
  metadata,
  focusManager,
}: {
  sectionsData: PreferenceSectionsData;
  metadata: ModalMetadata;
  focusManager: FocusManager;
}) => {
  const registerFallbackHeading = useFallbackHeadingRegistrar({
    panelHeadingId: sectionsData.panel.headingId,
    registerHeading: focusManager.registerHeading,
  });

  return useFormProps({
    metadata,
    handleSubmit: sectionsData.handleSubmit,
    registerFallbackHeading,
    activeSection: sectionsData.activeSection,
  });
};

export const useSettingsViewProps = ({
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
}) => {
  const modal = useModalProps({ open, onClose, metadata });
  const viewport = useSettingsViewport({ sectionsData, focusManager });
  const form = useSettingsForm({ sectionsData, metadata, focusManager });
  const closeAction = useCloseAction({ closeLabel: metadata.closeLabel, onClose });

  return useViewProps({
    modal,
    viewport,
    form,
    avatarEditor: sectionsData.avatarEditor?.modalProps,
    toast: sectionsData.feedback?.redeemToast,
    closeAction,
  });
};

export default useSettingsViewProps;
