import usePreferenceSections from "@app/pages/preferences/usePreferenceSections.js";
import useSectionFocusManager from "@shared/hooks/useSectionFocusManager.js";
import type { SettingsModalModelInput } from "./settingsModalTypes";
import useModalMetadata from "./useSettingsModalMetadata";
import useSettingsViewProps from "./useSettingsViewProps";

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
