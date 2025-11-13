import { useMemo } from "react";
import {
  DEFAULT_REFERENCE_SECTION_ID,
  resolvePanelHeight,
} from "./internal/settingsPanelHeightUtils.js";
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
  return useMemo(() => {
    const resolvedHeight = resolvePanelHeight(heightMap);
    return {
      bodyStyle:
        resolvedHeight == null
          ? undefined
          : { "--settings-body-height": `${resolvedHeight}px` },
      registerActivePanelNode,
      referenceMeasurement,
    };
  }, [heightMap, registerActivePanelNode, referenceMeasurement]);
}

export default useStableSettingsPanelHeight;
