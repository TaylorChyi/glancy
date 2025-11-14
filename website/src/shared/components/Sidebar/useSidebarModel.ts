import { useMemo } from "react";
import useSidebarNavigation from "./hooks/useSidebarNavigation.js";
import {
  buildHistoryProps,
  buildLayoutProps,
  buildNavigationProps,
} from "./sidebarViewMappers";

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

const useSidebarLayout = (
  navigationState: ReturnType<typeof useSidebarNavigation>,
) => {
  const { closeSidebar, isMobile, isOpen, shouldShowOverlay } = navigationState;

  return useMemo(
    () =>
      buildLayoutProps({
        closeSidebar,
        isMobile,
        isOpen,
        shouldShowOverlay,
      }),
    [closeSidebar, isMobile, isOpen, shouldShowOverlay],
  );
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
  const layout = useSidebarLayout(navigationState);

  return {
    viewProps: {
      layout,
      navigation: buildNavigationProps(navigationState),
      history: buildHistoryProps({ navigationState, onSelectHistory }),
      footer: {},
    },
  };
};

export default useSidebarModel;
