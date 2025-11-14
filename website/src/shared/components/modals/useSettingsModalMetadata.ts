import { useMemo } from "react";
import type {
  CopyData,
  HeaderData,
  ModalMetadata,
  PanelData,
} from "./settingsModalTypes";

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

const createModalMetadata = ({
  panel,
  header,
  copy,
}: {
  panel: PanelData;
  header: HeaderData;
  copy: CopyData;
}): ModalMetadata => ({
  headingId: panel.focusHeadingId || panel.modalHeadingId,
  descriptionId: panel.descriptionId || header.descriptionId,
  closeLabel: buildCloseLabel(copy.closeLabel, panel.modalHeadingText),
  fallbackHeadingId: panel.modalHeadingId,
  fallbackHeadingText: panel.modalHeadingText || copy.title,
  sectionHeadingId: panel.headingId || panel.modalHeadingId,
  sectionDescriptionId: panel.descriptionId,
  shouldRenderFallbackHeading: !panel.headingId,
});

export const useModalMetadata = ({
  panel,
  header,
  copy,
}: {
  panel: PanelData;
  header: HeaderData;
  copy: CopyData;
}): ModalMetadata =>
  useMemo(
    () => createModalMetadata({ panel, header, copy }),
    [panel, header, copy],
  );

export default useModalMetadata;
