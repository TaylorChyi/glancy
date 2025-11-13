import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import Sidebar from "@shared/components/Sidebar";
import ThemeIcon from "@shared/components/ui/Icon";
// 直接引用移动端判断 Hook，避免 utils 桶状导出的循环依赖在移动端首屏触发。
import { useIsMobile } from "@shared/utils/device.js";
import { BRAND_LOGO_ICON } from "@shared/utils/brand.js";
import styles from "./Layout.module.css";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const resolveSidebarBounds = (container) => {
  const computed = window.getComputedStyle(container);
  const min = Number.parseFloat(
    computed.getPropertyValue("--layout-sidebar-min"),
  );
  const max = Number.parseFloat(
    computed.getPropertyValue("--layout-sidebar-max"),
  );
  return {
    minWidth: Number.isNaN(min) ? 240 : min,
    maxWidth: Number.isNaN(max) ? 420 : max,
  };
};

const attachSidebarResizeListeners = ({
  event,
  sidebarRef,
  containerRef,
  resizeFrame,
  setSidebarWidth,
}) => {
  event.preventDefault();
  document.body.style.userSelect = "none";

  const { width: initialWidth } =
    sidebarRef.current.getBoundingClientRect();
  const { minWidth, maxWidth } = resolveSidebarBounds(containerRef.current);
  const startX = event.clientX;

  const handlePointerMove = (moveEvent) => {
    if (resizeFrame.current) {
      cancelAnimationFrame(resizeFrame.current);
      resizeFrame.current = null;
    }
    resizeFrame.current = requestAnimationFrame(() => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = clamp(initialWidth + delta, minWidth, maxWidth);
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
};

const useSidebarResizer = (isMobile, containerRef) => {
  const sidebarRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(null);
  const resizeFrame = useRef(null);

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
      attachSidebarResizeListeners({
        event,
        sidebarRef,
        containerRef,
        resizeFrame,
        setSidebarWidth,
      });
    },
    [containerRef, isMobile],
  );

  return { sidebarRef, sidebarWidth, handlePointerDown };
};

const useMainScrollRef = (onMainMiddleScroll) => {
  const contentRef = useRef(null);
  useEffect(() => {
    if (!onMainMiddleScroll) {
      return undefined;
    }
    const node = contentRef.current;
    if (!node) {
      return undefined;
    }
    const handleScroll = (event) => {
      onMainMiddleScroll(event);
    };
    node.addEventListener("scroll", handleScroll);
    return () => node.removeEventListener("scroll", handleScroll);
  }, [contentRef, onMainMiddleScroll]);
  return contentRef;
};

const useDockerMeasurements = (shouldRenderDocker) => {
  const dockerRef = useRef(null);
  const [dockerHeight, setDockerHeight] = useState(0);

  useEffect(() => {
    if (!shouldRenderDocker) {
      setDockerHeight((prev) => (prev === 0 ? prev : 0));
      return undefined;
    }
    const node = dockerRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return undefined;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries?.[0];
      if (!entry) return;
      const nextHeight = Math.round(entry.contentRect.height);
      setDockerHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      setDockerHeight((prev) => (prev === 0 ? prev : 0));
    };
  }, [dockerRef, shouldRenderDocker]);

  return { dockerRef, dockerHeight };
};

function Layout({
  children,
  sidebarProps = {},
  bottomContent = null,
  onMainMiddleScroll,
}) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const containerRef = useRef(null);
  const shouldRenderDocker = Boolean(bottomContent);
  const { sidebarRef, sidebarWidth, handlePointerDown } = useSidebarResizer(
    isMobile,
    containerRef,
  );
  const contentRef = useMainScrollRef(onMainMiddleScroll);
  const { dockerRef, dockerHeight } =
    useDockerMeasurements(shouldRenderDocker);

  const containerStyle = useMemo(() => {
    const resolvedDockerHeight = shouldRenderDocker ? dockerHeight : 0;
    const style = {
      "--docker-h": `${resolvedDockerHeight}px`,
    };
    if (!isMobile && typeof sidebarWidth === "number") {
      style["--sidebar-w"] = `${Math.round(sidebarWidth)}px`;
    }
    return style;
  }, [dockerHeight, isMobile, sidebarWidth, shouldRenderDocker]);

  return (
    <div
      ref={containerRef}
      id="app"
      className={styles.app}
      style={containerStyle}
    >
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
      <main id="main" className={styles.main}>
        {isMobile ? (
          <div className={styles["main-top"]}>
            <button
              type="button"
              className={styles["sidebar-toggle"]}
              onClick={() => setSidebarOpen(true)}
              aria-label="打开侧边栏"
            >
              <ThemeIcon name={BRAND_LOGO_ICON} width={24} height={24} />
            </button>
          </div>
        ) : null}
        <section id="content" ref={contentRef} className={styles.content}>
          <div className={styles["content-inner"]}>{children}</div>
        </section>
        {shouldRenderDocker ? (
          <div
            id="docker"
            ref={dockerRef}
            className={styles.docker}
            aria-label="底部工具条"
          >
            <div className={styles["docker-inner"]}>{bottomContent}</div>
          </div>
        ) : null}
      </main>
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
