import { forwardRef } from "react";
import PropTypes from "prop-types";
import styles from "../Sidebar.module.css";
import { getSidebarClassName } from "./classNames.js";

const SidebarOverlay = ({ showOverlay, onOverlayClick }) =>
  showOverlay ? (
    <div className="sidebar-overlay" onClick={onOverlayClick} />
  ) : null;

const SidebarHeader = ({ navigation }) => (
  <div className={styles.header} data-testid="sidebar-header">
    {navigation}
  </div>
);

const SidebarHistory = ({ historyAriaLabel, historySection }) => (
  <nav
    className={styles.entries}
    aria-label={historyAriaLabel}
    data-testid="sidebar-scroll"
  >
    {historySection}
  </nav>
);

const SidebarFooter = ({ footerSection }) => (
  <footer className={styles.footer} data-testid="sidebar-footer">
    {footerSection}
  </footer>
);

const SidebarContent = forwardRef(function SidebarContent(
  {
    isMobile,
    open,
    navigation,
    historyAriaLabel,
    historySection,
    footerSection,
  },
  ref,
) {
  return (
    <aside
      ref={ref}
      id="sidebar"
      data-testid="sidebar"
      className={getSidebarClassName({ isMobile, open, containerClass: styles.container })}
    >
      <SidebarHeader navigation={navigation} />
      <SidebarHistory
        historyAriaLabel={historyAriaLabel}
        historySection={historySection}
      />
      <SidebarFooter footerSection={footerSection} />
    </aside>
  );
});

const SidebarLayout = forwardRef(function SidebarLayout(
  { showOverlay, onOverlayClick, ...contentProps },
  ref,
) {
  return (
    <>
      <SidebarOverlay
        showOverlay={showOverlay}
        onOverlayClick={onOverlayClick}
      />
      <SidebarContent ref={ref} {...contentProps} />
    </>
  );
});

SidebarLayout.propTypes = {
  isMobile: PropTypes.bool,
  open: PropTypes.bool,
  showOverlay: PropTypes.bool,
  onOverlayClick: PropTypes.func,
  navigation: PropTypes.node.isRequired,
  historyAriaLabel: PropTypes.string,
  historySection: PropTypes.node.isRequired,
  footerSection: PropTypes.node.isRequired,
};

SidebarLayout.defaultProps = {
  isMobile: false,
  open: false,
  showOverlay: false,
  onOverlayClick: undefined,
  historyAriaLabel: undefined,
};

export default SidebarLayout;
