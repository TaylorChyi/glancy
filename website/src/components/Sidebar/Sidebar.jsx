import { forwardRef } from "react";
import Brand from "@/components/Brand";
import SidebarQuickActions from "./SidebarQuickActions.jsx";
import SidebarHistory from "./SidebarHistory.jsx";
import SidebarUser from "./SidebarUser.jsx";
import { useIsMobile } from "@/utils";
import styles from "./Sidebar.module.css";

function Sidebar(
  {
    isMobile: mobileProp,
    open = false,
    onClose,
    onToggleFavorites,
    onSelectHistory,
  },
  ref,
) {
  const defaultMobile = useIsMobile();
  const isMobile = mobileProp ?? defaultMobile;
  return (
    <>
      {isMobile && open && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
      <aside
        ref={ref}
        className={`sidebar${isMobile ? (open ? " mobile-open" : "") : ""}`}
      >
        <Brand />
        <div className={styles["sidebar-content"]}>
          <SidebarQuickActions onToggleFavorites={onToggleFavorites} />
          <SidebarHistory onSelectHistory={onSelectHistory} />
        </div>
        <SidebarUser />
      </aside>
    </>
  );
}

export default forwardRef(Sidebar);
