import { FALLBACK_MODAL_HEADING_ID } from "../constants.js";
import { pickFirstMeaningfulString } from "./displayValues.js";

const buildSectionAnchor = (activeSection, suffix) =>
  activeSection ? `${activeSection.id}-${suffix}` : "";

const hasMeaningfulDescription = (activeSection) => {
  if (!activeSection) {
    return false;
  }

  const { message } = activeSection.componentProps ?? {};
  if (typeof message !== "string") {
    return false;
  }

  return message.trim().length > 0;
};

export const createPanelMetadata = ({ activeSection, modalTitle }) => {
  const panelId = buildSectionAnchor(activeSection, "panel");
  const tabId = buildSectionAnchor(activeSection, "tab");
  const headingId = buildSectionAnchor(activeSection, "section-heading");
  const descriptionId = hasMeaningfulDescription(activeSection)
    ? buildSectionAnchor(activeSection, "section-description")
    : undefined;
  const modalHeadingText = pickFirstMeaningfulString(
    [activeSection?.componentProps?.title, activeSection?.label],
    modalTitle,
  );
  const focusHeadingId = headingId || FALLBACK_MODAL_HEADING_ID;

  return {
    panelId,
    tabId,
    headingId,
    descriptionId,
    focusHeadingId,
    modalHeadingId: FALLBACK_MODAL_HEADING_ID,
    modalHeadingText,
  };
};
