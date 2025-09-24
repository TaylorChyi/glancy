import Brand from "@/components/Brand";
import SidebarFunctions from "./SidebarFunctions.jsx";
import SidebarUser from "./SidebarUser.jsx";
import { useIsMobile } from "@/utils";

function Sidebar({
  isMobile: mobileProp,
  open = false,
  onClose,
  onToggleFavorites,
  onSelectHistory,
}) {
  const defaultMobile = useIsMobile();
  const isMobile = mobileProp ?? defaultMobile;
  return (
    <>
      {isMobile && open && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
      <aside
        className={`sidebar${isMobile ? (open ? " mobile-open" : "") : ""}`}
      >
        <Brand />
        <SidebarFunctions
          onToggleFavorites={onToggleFavorites}
          onSelectHistory={onSelectHistory}
        />
        <SidebarUser />
      </aside>
    </>
  );
}

export default Sidebar;
