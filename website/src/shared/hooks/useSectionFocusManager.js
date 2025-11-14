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

const focusHeadingOrFallback = ({
  headingRef,
  headingId,
  lastFocusOriginRef,
}) => {
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
};

const trackActiveSectionChange = ({
  activeSectionId,
  headingRef,
  lastActiveSectionIdRef,
  hasInitializedRef,
}) => {
  const previousActiveSectionId = lastActiveSectionIdRef.current;
  lastActiveSectionIdRef.current = activeSectionId;

  if (!hasInitializedRef.current) {
    hasInitializedRef.current = true;
    return false;
  }

  if (previousActiveSectionId === activeSectionId && headingRef.current) {
    return false;
  }

  return true;
};

const shouldProcessFocus = ({
  activeSectionId,
  headingRef,
  hasInitializedRef,
  lastActiveSectionIdRef,
}) => {
  if (!activeSectionId || !isBrowser) {
    return false;
  }

  return trackActiveSectionChange({
    activeSectionId,
    headingRef,
    lastActiveSectionIdRef,
    hasInitializedRef,
  });
};

const scheduleHeadingFocus = ({
  headingId,
  headingRef,
  lastFocusOriginRef,
}) =>
  requestFrame(() =>
    focusHeadingOrFallback({ headingRef, headingId, lastFocusOriginRef }),
  );

const runSectionFocusEffect = ({
  activeSectionId,
  headingId,
  headingRef,
  hasInitializedRef,
  lastActiveSectionIdRef,
  lastFocusOriginRef,
}) => {
  if (
    !shouldProcessFocus({
      activeSectionId,
      headingRef,
      hasInitializedRef,
      lastActiveSectionIdRef,
    })
  ) {
    return undefined;
  }

  const frameId = scheduleHeadingFocus({
    headingId,
    headingRef,
    lastFocusOriginRef,
  });

  return () => {
    cancelFrame(frameId);
  };
};

const useFocusOriginCapture = (lastFocusOriginRef) =>
  useCallback(() => {
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
  }, [lastFocusOriginRef]);

const useHeadingRegistration = (headingRef) =>
  useCallback((headingElement) => {
    headingRef.current = headingElement ?? null;
    if (headingElement) {
      ensureHeadingTabIndex(headingElement);
    }
  }, [headingRef]);

const useSectionFocusEffect = ({
  activeSectionId,
  headingId,
  headingRef,
  hasInitializedRef,
  lastActiveSectionIdRef,
  lastFocusOriginRef,
}) =>
  useLayoutEffect(
    () =>
      runSectionFocusEffect({
        activeSectionId,
        headingId,
        headingRef,
        hasInitializedRef,
        lastActiveSectionIdRef,
        lastFocusOriginRef,
      }),
    [
      activeSectionId,
      headingId,
      headingRef,
      hasInitializedRef,
      lastActiveSectionIdRef,
      lastFocusOriginRef,
    ],
  );

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

  const captureFocusOrigin = useFocusOriginCapture(lastFocusOriginRef);
  const registerHeading = useHeadingRegistration(headingRef);

  useSectionFocusEffect({
    activeSectionId,
    headingId,
    headingRef,
    hasInitializedRef,
    lastActiveSectionIdRef,
    lastFocusOriginRef,
  });

  return {
    captureFocusOrigin,
    registerHeading,
  };
}

export default useSectionFocusManager;
