import { useMemo } from "react";
import useSidebarNavigation from "./hooks/useSidebarNavigation.js";

type SidebarModelInput = {
  isMobile?: boolean;
  open?: boolean;
  onClose?: () => void;
  onShowDictionary?: () => void;
  onShowLibrary?: () => void;
  activeView?: string;
  onSelectHistory?: (id?: string) => void;
};

type SidebarViewProps = {
  layout: {
    isMobile: boolean;
    open: boolean;
    showOverlay: boolean;
    onOverlayClick?: () => void;
  };
  navigation: {
    items: Array<Record<string, unknown>>;
    ariaLabel?: string;
  };
  history: {
    ariaLabel?: string;
    onSelectHistory?: (id?: string) => void;
  };
  footer: Record<string, never>;
};

export type SidebarModel = {
  viewProps: SidebarViewProps;
};

export const useSidebarModel = ({
  isMobile: isMobileProp,
  open,
  onClose,
  onShowDictionary,
  onShowLibrary,
  activeView,
  onSelectHistory,
}: SidebarModelInput): SidebarModel => {
  const navigationState = useSidebarNavigation({
    isMobile: isMobileProp,
    open,
    onClose,
    onShowDictionary,
    onShowLibrary,
    activeView,
  });

  const historyAriaLabel = useMemo(() => {
    return navigationState.historyLabel || navigationState.entriesLabel;
  }, [navigationState.entriesLabel, navigationState.historyLabel]);

  const layout = useMemo(
    () => ({
      isMobile: navigationState.isMobile,
      open: navigationState.isOpen,
      showOverlay: navigationState.shouldShowOverlay,
      onOverlayClick: navigationState.isMobile
        ? navigationState.closeSidebar
        : undefined,
    }),
    [
      navigationState.closeSidebar,
      navigationState.isMobile,
      navigationState.isOpen,
      navigationState.shouldShowOverlay,
    ],
  );

  return {
    viewProps: {
      layout,
      navigation: {
        items: navigationState.navigationActions as Array<Record<string, unknown>>,
        ariaLabel: navigationState.headerLabel,
      },
      history: {
        ariaLabel: historyAriaLabel,
        onSelectHistory,
      },
      footer: {},
    },
  };
};

export default useSidebarModel;
