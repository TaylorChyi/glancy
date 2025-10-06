/**
 * 背景：
 *  - 旧版 Layout 采用 main-middle/main-bottom 的多层容器，底部工具条与滚动上下文割裂，
 *    导致搜索栏定位与内容滚动互相干扰。
 * 目的：
 *  - 实现“sidebar + main(content + docker)”的二层两区结构，固定 docker 于主区底部，
 *    并确保滚动仅发生在内容区域。
 * 关键决策与取舍：
 *  - 以 CSS 变量暴露侧边栏宽度、底部高度，结合 ResizeObserver 同步 content padding，
 *    兼顾响应式断点；
 *  - 保留现有侧边栏抽屉逻辑，避免一次性替换导航体系。
 * 影响范围：
 *  - App 页面布局、Sidebar 尺寸同步、底部搜索/释义操作条。
 * 演进与TODO：
 *  - 后续可将断点阈值抽为配置，或将布局拆分为可测试的 Hooks。
 */
import {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import PropTypes from "prop-types";
import Sidebar from "@/components/Sidebar";
import ThemeIcon from "@/components/ui/Icon";
// 直接引用移动端判断 Hook，避免 utils 桶状导出的循环依赖在移动端首屏触发。
import { useIsMobile } from "@/utils/device.js";
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
  const contentRef = useRef(null);
  const dockerRef = useRef(null);
  const [dockerHeight, setDockerHeight] = useState(0);
  const shouldRenderDocker = Boolean(bottomContent);

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
    const resolvedDockerHeight = shouldRenderDocker ? dockerHeight : 0;
    const style = {
      "--docker-h": `${resolvedDockerHeight}px`,
    };
    if (!isMobile && typeof sidebarWidth === "number") {
      style["--sidebar-w"] = `${Math.round(sidebarWidth)}px`;
    }
    return style;
  }, [dockerHeight, isMobile, sidebarWidth, shouldRenderDocker]);

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
    return () => {
      node.removeEventListener("scroll", handleScroll);
    };
  }, [onMainMiddleScroll]);

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
  }, [shouldRenderDocker]);

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
              <ThemeIcon name="glancy-web" width={24} height={24} />
            </button>
          </div>
        ) : null}
        <section
          id="content"
          ref={contentRef}
          className={styles.content}
        >
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
