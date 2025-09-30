import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import Sidebar from "@/components/Sidebar";
import ThemeIcon from "@/components/ui/Icon";
import { useIsMobile } from "@/utils";
import styles from "./Layout.module.css";

function Layout({
  children,
  sidebarProps = {},
  bottomContent = null,
  onMainMiddleScroll,
}) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(null);
  const containerRef = useRef(null);
  const sidebarRef = useRef(null);
  const resizeFrame = useRef(null);
  const mainMiddleRef = useRef(null);

  useEffect(() => {
    if (isMobile) {
      setSidebarWidth(null);
    }
  }, [isMobile]);

  useEffect(
    () => () => {
      if (resizeFrame.current) {
        cancelAnimationFrame(resizeFrame.current);
        resizeFrame.current = null;
      }
      document.body?.style?.removeProperty?.("user-select");
    },
    [],
  );

  const handlePointerDown = useCallback(
    (event) => {
      if (isMobile) return;
      if (!sidebarRef.current || !containerRef.current) return;

      event.preventDefault();
      document.body.style.userSelect = "none";

      const { clientX: startX } = event;
      const computed = window.getComputedStyle(containerRef.current);
      const min = Number.parseFloat(
        computed.getPropertyValue("--layout-sidebar-min"),
      );
      const max = Number.parseFloat(
        computed.getPropertyValue("--layout-sidebar-max"),
      );
      const { width: initialWidth } =
        sidebarRef.current.getBoundingClientRect();
      const minWidth = Number.isNaN(min) ? 240 : min;
      const maxWidth = Number.isNaN(max) ? 420 : max;

      const handlePointerMove = (moveEvent) => {
        if (resizeFrame.current) {
          cancelAnimationFrame(resizeFrame.current);
          resizeFrame.current = null;
        }

        resizeFrame.current = requestAnimationFrame(() => {
          const delta = moveEvent.clientX - startX;
          const nextWidth = Math.max(
            minWidth,
            Math.min(maxWidth, initialWidth + delta),
          );
          setSidebarWidth(nextWidth);
        });
      };

      const handlePointerUp = () => {
        if (resizeFrame.current) {
          cancelAnimationFrame(resizeFrame.current);
          resizeFrame.current = null;
        }
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        document.body.style.removeProperty("user-select");
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [isMobile],
  );

  const containerStyle = useMemo(() => {
    if (!sidebarWidth || isMobile) return undefined;
    return { "--layout-sidebar-width": `${Math.round(sidebarWidth)}px` };
  }, [sidebarWidth, isMobile]);

  useEffect(() => {
    if (!onMainMiddleScroll) {
      return undefined;
    }
    const node = mainMiddleRef.current;
    if (!node) {
      return undefined;
    }
    const handleScroll = (event) => {
      onMainMiddleScroll(event);
    };
    node.addEventListener("scroll", handleScroll);
    return () => {
      node.removeEventListener("scroll", handleScroll);
    };
  }, [onMainMiddleScroll]);

  return (
    <div ref={containerRef} className={styles.container} style={containerStyle}>
      <Sidebar
        {...sidebarProps}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        ref={sidebarRef}
      />
      {!isMobile ? (
        <div
          className={styles.resizer}
          role="separator"
          aria-orientation="vertical"
          aria-hidden="true"
          onPointerDown={handlePointerDown}
        />
      ) : null}
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
          <div ref={mainMiddleRef} className={styles["main-middle"]}>
            {children}
          </div>
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

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  sidebarProps: PropTypes.object,
  bottomContent: PropTypes.node,
  onMainMiddleScroll: PropTypes.func,
};

Layout.defaultProps = {
  sidebarProps: {},
  bottomContent: null,
  onMainMiddleScroll: undefined,
};
