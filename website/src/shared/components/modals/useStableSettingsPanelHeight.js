import { useMemo } from "react";
import { DEFAULT_REFERENCE_SECTION_ID } from "./internal/settingsPanelHeightUtils.js";
import { usePanelHeightRegistry } from "./internal/settingsPanelHeightRegistry.js";

function useStableSettingsPanelHeight({
  sections,
  activeSectionId,
  referenceSectionId = DEFAULT_REFERENCE_SECTION_ID,
}) {
  const {
    heightMap,
    referenceMeasurement,
    registerActivePanelNode,
  } = usePanelHeightRegistry({
    sections,
    activeSectionId,
    referenceSectionId,
  });

  const resolvedHeight = useMemo(() => {
    if (heightMap.reference) {
      return Math.ceil(heightMap.reference);
    }
    if (heightMap.active) {
      return Math.ceil(heightMap.active);
    }
    return null;
  }, [heightMap]);

  const bodyStyle = useMemo(() => {
    if (!resolvedHeight) {
      return undefined;
    }
    return {
      "--settings-body-height": `${resolvedHeight}px`,
    };
  }, [resolvedHeight]);

  return {
    bodyStyle,
    registerActivePanelNode,
    referenceMeasurement,
  };
}

export default useStableSettingsPanelHeight;
