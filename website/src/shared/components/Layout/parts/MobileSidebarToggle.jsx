import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon";
import { BRAND_LOGO_ICON } from "@shared/utils/brand.js";
import styles from "../Layout.module.css";

function MobileSidebarToggle({ isMobile, onToggleSidebar }) {
  if (!isMobile) {
    return null;
  }
  return (
    <div className={styles["main-top"]}>
      <button
        type="button"
        className={styles["sidebar-toggle"]}
        onClick={onToggleSidebar}
        aria-label="打开侧边栏"
      >
        <ThemeIcon name={BRAND_LOGO_ICON} width={24} height={24} />
      </button>
    </div>
  );
}

MobileSidebarToggle.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  onToggleSidebar: PropTypes.func.isRequired,
};

export default MobileSidebarToggle;
