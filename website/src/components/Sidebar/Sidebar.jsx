import { forwardRef } from "react";
import Brand from "@/components/Brand";
import SidebarHistory from "./SidebarHistory.jsx";
import SidebarUser from "./SidebarUser.jsx";
import { useIsMobile } from "@/utils";
import styles from "./Sidebar.module.css";

function Sidebar(
  {
    isMobile: mobileProp,
    open = false,
    onClose,
    onShowDictionary,
    onShowFavorites,
    activeView,
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
        <Brand
          activeView={activeView}
          onShowDictionary={onShowDictionary}
          onShowFavorites={onShowFavorites}
        />
        <div className={styles["sidebar-content"]}>
          <SidebarHistory onSelectHistory={onSelectHistory} />
        </div>
        <SidebarUser />
      </aside>
    </>
  );
}

export default forwardRef(Sidebar);
