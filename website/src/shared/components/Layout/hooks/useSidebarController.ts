import { useCallback, useMemo, useState } from "react";

type UseSidebarControllerParams = {
  sidebarProps: Record<string, unknown>;
  isMobile: boolean;
};

type UseSidebarControllerResult = {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  mergedSidebarProps: Record<string, unknown>;
};

export const useSidebarController = ({
  sidebarProps,
  isMobile,
}: UseSidebarControllerParams): UseSidebarControllerResult => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    const onClose = sidebarProps?.onClose;
    if (typeof onClose === "function") onClose();
  }, [sidebarProps]);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  const mergedSidebarProps = useMemo(
    () => ({ ...sidebarProps, open: sidebarOpen, onClose: closeSidebar, isMobile }),
    [closeSidebar, isMobile, sidebarOpen, sidebarProps],
  );

  return { sidebarOpen, openSidebar, closeSidebar, mergedSidebarProps };
};
