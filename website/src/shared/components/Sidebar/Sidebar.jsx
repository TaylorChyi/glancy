import { forwardRef, useMemo } from "react";
import PropTypes from "prop-types";
import SidebarHistorySection from "./SidebarHistorySection.jsx";
import SidebarUserSection from "./SidebarUserSection.jsx";
import SidebarHeader from "./header/SidebarHeader.jsx";
import SidebarLayout from "./layout/SidebarLayout.jsx";
import useSidebarNavigation from "./hooks/useSidebarNavigation.js";

function Sidebar(
  {
    isMobile: mobileProp,
    open,
    onClose,
    onShowDictionary,
    onShowLibrary,
    activeView,
    onSelectHistory,
  },
  ref,
) {
  const navigationState = useSidebarNavigation({
    isMobile: mobileProp,
    open,
    onClose,
    onShowDictionary,
    onShowLibrary,
    activeView,
  });

  const historyAriaLabel = useMemo(() => {
    return navigationState.historyLabel || navigationState.entriesLabel;
  }, [navigationState.entriesLabel, navigationState.historyLabel]);

  return (
    <SidebarLayout
      ref={ref}
      isMobile={navigationState.isMobile}
      open={navigationState.isOpen}
      showOverlay={navigationState.shouldShowOverlay}
      onOverlayClick={
        navigationState.isMobile ? navigationState.closeSidebar : undefined
      }
      navigation={
        <SidebarHeader
          items={navigationState.navigationActions}
          ariaLabel={navigationState.headerLabel}
        />
      }
      historyAriaLabel={historyAriaLabel}
      historySection={
        <SidebarHistorySection onSelectHistory={onSelectHistory} />
      }
      footerSection={<SidebarUserSection />}
    />
  );
}

Sidebar.propTypes = {
  isMobile: PropTypes.bool,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onShowDictionary: PropTypes.func,
  onShowLibrary: PropTypes.func,
  activeView: PropTypes.string,
  onSelectHistory: PropTypes.func,
};

Sidebar.defaultProps = {
  isMobile: undefined,
  open: false,
  onClose: undefined,
  onShowDictionary: undefined,
  onShowLibrary: undefined,
  activeView: undefined,
  onSelectHistory: undefined,
};

export default forwardRef(Sidebar);
