/**
 * 背景：
 *  - 通用 Popover 在工具栏的滚动场景下经常出现定位延迟或被外层 z-index 遮挡，导致分享菜单看似“未打开”。
 * 目的：
 *  - 为分享菜单专门构建轻量级浮层承载，复用状态 Hook 但自行处理定位与关闭策略，确保交互稳定。
 * 关键决策与取舍：
 *  - 采用门面模式封装位置计算与事件监听，对外仅暴露极简的 props，避免调用方重复拼装 Popover；
 *  - 坚持使用 requestAnimationFrame 驱动计算以降低布局抖动，同时提供视口内的回退位置以兼顾小屏体验。
 * 影响范围：
 *  - OutputToolbar 分享交互；未来若有其他模块需要类似策略，可在 shared 层复用该组件。
 * 演进与TODO：
 *  - 后续可抽象出通用 FloatingLayer，将位置策略通过策略模式外置以支持更多 placement 组合。
 */
import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import ShareMenu from "./ShareMenu.jsx";
import styles from "../OutputToolbar.module.css";

const VIEWPORT_PADDING = 12;
const DEFAULT_OFFSET = 8;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const resolveViewport = () => {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
};

const computeAnchoredPosition = ({ anchorRect, menuRect, offset }) => {
  const viewport = resolveViewport();
  const preferredTop = anchorRect.top - menuRect.height - offset;
  const fallbackTop = anchorRect.bottom + offset;
  const minTop = VIEWPORT_PADDING;
  const maxTop = Math.max(minTop, viewport.height - menuRect.height - VIEWPORT_PADDING);

  let placement = "top";
  let top = preferredTop;
  if (preferredTop < minTop) {
    placement = "bottom";
    top = clamp(fallbackTop, minTop, maxTop);
  } else {
    top = clamp(preferredTop, minTop, maxTop);
  }

  const rawLeft = anchorRect.right - menuRect.width;
  const minLeft = VIEWPORT_PADDING;
  const maxLeft = Math.max(minLeft, viewport.width - menuRect.width - VIEWPORT_PADDING);
  const left = clamp(rawLeft, minLeft, maxLeft);

  return { top, left, placement };
};

function ShareMenuSurface({ shareMenu, translator }) {
  const {
    isOpen,
    anchorBoundaryRef,
    shareMenuRef,
    closeMenu,
    capabilities,
    menuId,
  } = shareMenu;

  const localMenuNodeRef = useRef(null);
  const rafRef = useRef(null);
  const [geometry, setGeometry] = useState({ top: 0, left: 0, placement: "top" });

  const assignMenuNode = useCallback(
    (node) => {
      localMenuNodeRef.current = node;
      if (shareMenuRef) {
        shareMenuRef.current = node;
      }
    },
    [shareMenuRef],
  );

  const schedulePositionUpdate = useCallback(() => {
    if (!isOpen || typeof window === "undefined") return;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const anchorEl = anchorBoundaryRef?.current ?? null;
      const menuEl = localMenuNodeRef.current;
      if (!anchorEl || !menuEl) return;
      const anchorRect = anchorEl.getBoundingClientRect();
      const menuRect = menuEl.getBoundingClientRect();
      const nextGeometry = computeAnchoredPosition({
        anchorRect,
        menuRect,
        offset: DEFAULT_OFFSET,
      });
      setGeometry((prev) =>
        prev.top === nextGeometry.top &&
        prev.left === nextGeometry.left &&
        prev.placement === nextGeometry.placement
          ? prev
          : nextGeometry,
      );
    });
  }, [anchorBoundaryRef, isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    schedulePositionUpdate();

    const handleScroll = () => schedulePositionUpdate();
    const handleResize = () => schedulePositionUpdate();
    const anchorEl = anchorBoundaryRef?.current ?? null;
    const menuEl = localMenuNodeRef.current;

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => schedulePositionUpdate())
        : null;
    if (resizeObserver) {
      if (anchorEl) resizeObserver.observe(anchorEl);
      if (menuEl) resizeObserver.observe(menuEl);
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      resizeObserver?.disconnect();
    };
  }, [anchorBoundaryRef, isOpen, schedulePositionUpdate]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event) => {
      const anchorEl = anchorBoundaryRef?.current ?? null;
      const menuEl = localMenuNodeRef.current;
      if (menuEl?.contains(event.target)) return;
      if (anchorEl?.contains(event.target)) return;
      closeMenu();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorBoundaryRef, closeMenu, isOpen]);

  useEffect(() => () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={styles["share-menu-surface"]}
      data-placement={geometry.placement}
      style={{ top: `${geometry.top}px`, left: `${geometry.left}px` }}
      ref={assignMenuNode}
    >
      <ShareMenu
        isOpen
        menuRef={assignMenuNode}
        capabilities={capabilities}
        closeMenu={closeMenu}
        translator={translator}
        menuId={menuId}
      />
    </div>,
    document.body,
  );
}

ShareMenuSurface.propTypes = {
  shareMenu: PropTypes.shape({
    isOpen: PropTypes.bool.isRequired,
    anchorBoundaryRef: PropTypes.shape({ current: PropTypes.any }),
    shareMenuRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
    closeMenu: PropTypes.func.isRequired,
    capabilities: PropTypes.shape({
      hasCopy: PropTypes.bool,
      hasImage: PropTypes.bool,
      onCopyLink: PropTypes.func,
      onExportImage: PropTypes.func,
      isImageExporting: PropTypes.bool,
      canExportImage: PropTypes.bool,
    }),
    menuId: PropTypes.string.isRequired,
  }).isRequired,
  translator: PropTypes.shape({
    shareMenuLabel: PropTypes.string,
    share: PropTypes.string,
    shareOptionLink: PropTypes.string,
    shareCopySuccess: PropTypes.string,
    shareOptionImage: PropTypes.string,
  }).isRequired,
};

export default ShareMenuSurface;
