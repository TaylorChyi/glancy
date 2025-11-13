import { forwardRef } from "react";
import PropTypes from "prop-types";
import styles from "../Sidebar.module.css";
import { getSidebarClassName } from "./classNames.js";

const SidebarLayout = forwardRef(function SidebarLayout(
  {
    isMobile,
    open,
    showOverlay,
    onOverlayClick,
    navigation,
    historyAriaLabel,
    historySection,
    footerSection,
  },
  ref,
) {
  return (
    <>
      {showOverlay ? (
        <div className="sidebar-overlay" onClick={onOverlayClick} />
      ) : null}
      <aside
        ref={ref}
        id="sidebar"
        data-testid="sidebar"
        className={getSidebarClassName({
          isMobile,
          open,
          containerClass: styles.container,
        })}
      >
        <div className={styles.header} data-testid="sidebar-header">
          {navigation}
        </div>
        <nav
          className={styles.entries}
          aria-label={historyAriaLabel}
          data-testid="sidebar-scroll"
        >
          {historySection}
        </nav>
        <footer className={styles.footer} data-testid="sidebar-footer">
          {footerSection}
        </footer>
      </aside>
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
