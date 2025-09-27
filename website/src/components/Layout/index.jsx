import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ThemeIcon from "@/components/ui/Icon";
import { useIsMobile } from "@/utils";
import styles from "./Layout.module.css";

function Layout({ children, sidebarProps = {}, bottomContent = null }) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.container}>
      <Sidebar
        {...sidebarProps}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />
      <div className={styles.main}>
        {isMobile ? (
          <div className={styles["main-top"]}>
            <button
              type="button"
              className={styles["sidebar-toggle"]}
              onClick={() => setSidebarOpen(true)}
              aria-label="打开侧边栏"
            >
              <ThemeIcon name="glancy-web" width={24} height={24} />
            </button>
          </div>
        ) : null}
        <div className={styles["main-content"]}>
          <div className={styles["main-middle"]}>{children}</div>
        </div>
        {bottomContent ? (
          <div className={styles["main-bottom"]}>
            <div className={styles["main-bottom-inner"]}>{bottomContent}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Layout;
