import { useMemo } from "react";
import type { CloseAction } from "../settingsModalTypes";

const createCloseAction = ({
  onClose,
  closeLabel,
}: {
  onClose: () => void;
  closeLabel: string;
}): CloseAction => ({
  label: closeLabel,
  onClose,
});

const useCloseAction = ({
  onClose,
  closeLabel,
}: {
  onClose: () => void;
  closeLabel: string;
}): CloseAction =>
  useMemo(() => createCloseAction({ onClose, closeLabel }), [onClose, closeLabel]);

export default useCloseAction;
