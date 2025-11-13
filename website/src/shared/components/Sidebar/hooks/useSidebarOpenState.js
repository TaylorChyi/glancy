import { useCallback, useEffect, useState } from "react";

export function useSidebarOpenState({ open, onClose }) {
  const isControlled = typeof open === "boolean";
  const [internalOpen, setInternalOpen] = useState(Boolean(open));

  useEffect(() => {
    if (isControlled) return;
    if (typeof open === "boolean") {
      setInternalOpen(open);
    }
  }, [isControlled, open]);

  const closeSidebar = useCallback(() => {
    if (typeof onClose === "function") {
      onClose();
      return;
    }
    if (!isControlled) {
      setInternalOpen(false);
    }
  }, [isControlled, onClose]);

  const openSidebar = useCallback(() => {
    if (isControlled) return;
    setInternalOpen(true);
  }, [isControlled]);

  const resolvedOpen = isControlled ? Boolean(open) : internalOpen;

  return {
    isOpen: resolvedOpen,
    isControlled,
    openSidebar,
    closeSidebar,
  };
}

export default useSidebarOpenState;
