import { useMemo } from "react";
import modalStyles from "../SettingsModal.module.css";
import type { ModalMetadata, ModalProps } from "../settingsModalTypes";

const createModalProps = ({
  open,
  onClose,
  metadata,
}: {
  open: boolean;
  onClose: () => void;
  metadata: ModalMetadata;
}): ModalProps => ({
  open,
  onClose,
  className: `${modalStyles.dialog} modal-content`,
  closeLabel: metadata.closeLabel,
  hideDefaultCloseButton: true,
  ariaLabelledBy: metadata.headingId,
  ariaDescribedBy: metadata.descriptionId,
});

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
  () => createModalProps({ open, onClose, metadata }),
  [
    open,
    onClose,
    metadata,
  ],
  );

export default useModalProps;
