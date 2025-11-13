export const DEFAULT_REFERENCE_SECTION_ID = "data";

export const sanitizeHeight = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  if (value <= 0) {
    return null;
  }
  return value;
};

export const deriveProbeHeadingId = (sectionId) => {
  if (typeof sectionId !== "string" || sectionId.trim().length === 0) {
    return "settings-panel-height-probe-heading";
  }
  return `${sectionId}-panel-height-probe-heading`;
};

export const deriveProbeDescriptionId = (candidate) => {
  if (typeof candidate !== "string" || candidate.trim().length === 0) {
    return undefined;
  }
  return `${candidate}-panel-height-probe`;
};

export const measureInstantly = (node) => {
  if (!node || typeof node.getBoundingClientRect !== "function") {
    return null;
  }
  const rect = node.getBoundingClientRect();
  return sanitizeHeight(rect?.height ?? null);
};

export const resolvePanelHeight = (heightMap) => {
  if (!heightMap || typeof heightMap !== "object") {
    return null;
  }
  if (heightMap.reference != null) {
    return Math.ceil(heightMap.reference);
  }
  if (heightMap.active != null) {
    return Math.ceil(heightMap.active);
  }
  return null;
};
