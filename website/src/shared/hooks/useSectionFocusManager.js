/**
 * 背景：
 *  - SettingsNav 与 SettingsPanel 在切换分区时缺乏统一的焦点管理，导致读屏器复诵与滚动跳跃问题。
 * 目的：
 *  - 通过集中式 Hook 复用焦点迁移策略，确保分区切换后标题获得焦点并回滚至视口起始位置。
 * 关键决策与取舍：
 *  - 采用组合模式：由容器负责调用 captureFocusOrigin，而面板通过 registerHeading 注入目标节点；拒绝直接在 Hook 内持有状态，避免重复渲染。
 * 影响范围：
 *  - SettingsModal 与 Preferences 页面在切换分区时的可访问性体验。
 * 演进与TODO：
 *  - TODO: 后续可扩展为自定义动画或平滑滚动策略，并在多列布局下支持自适应滚动容器。
 */
import { useCallback, useLayoutEffect, useRef } from "react";

const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

const requestFrame = (callback) => {
  if (isBrowser && typeof window.requestAnimationFrame === "function") {
    return window.requestAnimationFrame(callback);
  }
  return setTimeout(callback, 0);
};

const cancelFrame = (handle) => {
  if (isBrowser && typeof window.cancelAnimationFrame === "function") {
    window.cancelAnimationFrame(handle);
    return;
  }
  clearTimeout(handle);
};

const ensureHeadingTabIndex = (node) => {
  if (!node || node.hasAttribute("tabindex")) {
    return;
  }
  node.setAttribute("tabindex", "-1");
};

const isFocusable = (node) => Boolean(node && typeof node.focus === "function");

/**
 * 意图：在分区切换时聚焦指定标题，必要时回退至原始焦点来源。
 * 输入：
 *  - activeSectionId: 当前激活分区标识，用于侦测切换。
 *  - headingId: 目标标题的 DOM id，辅助调试与容错。
 * 输出：
 *  - captureFocusOrigin: 在触发切换前调用，用于记录焦点来源。
 *  - registerHeading: 由面板调用以注册标题 DOM 节点。
 * 流程：
 *  1) captureFocusOrigin 记录可聚焦元素。
 *  2) registerHeading 注入最新标题节点并补齐 tabindex。
 *  3) useLayoutEffect 监听 activeSectionId 变化，通过 requestAnimationFrame 聚焦标题并 scrollIntoView。
 * 错误处理：回退到上一次焦点来源，确保焦点不逃逸至 <body>。
 * 复杂度：时间 O(1)，空间 O(1)。
 */
function useSectionFocusManager({ activeSectionId, headingId }) {
  const headingRef = useRef(null);
  const lastFocusOriginRef = useRef(null);
  const lastActiveSectionIdRef = useRef();
  const hasInitializedRef = useRef(false);

  const captureFocusOrigin = useCallback(() => {
    if (!isBrowser) {
      lastFocusOriginRef.current = null;
      return;
    }
    const activeElement = document.activeElement;
    if (isFocusable(activeElement) && activeElement !== document.body) {
      lastFocusOriginRef.current = activeElement;
      return;
    }
    lastFocusOriginRef.current = null;
  }, []);

  const registerHeading = useCallback((headingElement) => {
    headingRef.current = headingElement ?? null;
    if (headingElement) {
      ensureHeadingTabIndex(headingElement);
    }
  }, []);

  useLayoutEffect(() => {
    if (!activeSectionId || !isBrowser) {
      return undefined;
    }

    const previousActiveSectionId = lastActiveSectionIdRef.current;
    lastActiveSectionIdRef.current = activeSectionId;

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return undefined;
    }

    if (previousActiveSectionId === activeSectionId && headingRef.current) {
      return undefined;
    }

    const frameId = requestFrame(() => {
      const headingElement = headingRef.current;
      if (headingElement && (!headingId || headingElement.id === headingId)) {
        ensureHeadingTabIndex(headingElement);
        try {
          headingElement.focus();
          if (typeof headingElement.scrollIntoView === "function") {
            headingElement.scrollIntoView({ block: "start" });
          }
          lastFocusOriginRef.current = null;
          return;
        } catch {
          // ignore and fall back to origin
        }
      }

      const fallbackTarget = lastFocusOriginRef.current;
      if (isFocusable(fallbackTarget)) {
        fallbackTarget.focus();
      }
    });

    return () => {
      cancelFrame(frameId);
    };
  }, [activeSectionId, headingId]);

  return {
    captureFocusOrigin,
    registerHeading,
  };
}

export default useSectionFocusManager;
