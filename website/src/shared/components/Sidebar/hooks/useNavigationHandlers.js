import { useCallback } from "react";

export function useNavigationHandlers({
  isMobile,
  closeSidebar,
  onShowDictionary,
  onShowLibrary,
}) {
  const handleDictionary = useCallback(() => {
    if (typeof onShowDictionary === "function") {
      onShowDictionary();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
    if (isMobile) {
      closeSidebar();
    }
  }, [closeSidebar, isMobile, onShowDictionary]);

  const handleLibrary = useCallback(() => {
    if (typeof onShowLibrary === "function") {
      onShowLibrary();
    }
    if (isMobile) {
      closeSidebar();
    }
  }, [closeSidebar, isMobile, onShowLibrary]);

  return {
    handleDictionary,
    handleLibrary,
  };
}

export default useNavigationHandlers;
