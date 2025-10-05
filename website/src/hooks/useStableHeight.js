/**
 * 背景：
 *  - 偏好设置面板在切换分区时会根据内容高度收缩或扩展，导致整体布局跳动。
 * 目的：
 *  - 通过统一的高度管理 Hook 复用测量与固高逻辑，确保包含内容的容器在不同场景下保持稳定高度。
 * 关键决策与取舍：
 *  - 采用策略模式抽象高度聚合方式（当前实现保留最大值），为未来按需引入“最新值”等策略留出扩展点。
 * 影响范围：
 *  - 所有需要在内容变化时维持稳定高度的容器（初次应用于 SettingsPanel）。
 * 演进与TODO：
 *  - TODO: 视需要支持外部传入最小/最大阈值或动画过渡策略，以便在更多复杂交互中复用。
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

const HEIGHT_STRATEGIES = {
  /**
   * 将高度锁定为历史最大值，避免在内容缩小时容器回弹。
   */
  "retain-max": (current, next) => {
    if (next === null) {
      return current;
    }
    if (current === null) {
      return next;
    }
    return Math.max(current, next);
  },
};

const MEASUREMENT_FALLBACK = 0;

/**
 * 统一从 DOM 节点读取高度，优先使用 getBoundingClientRect，以便覆盖浮点高度场景。
 */
const readElementHeight = (element) => {
  if (!element) {
    return MEASUREMENT_FALLBACK;
  }

  if (typeof element.getBoundingClientRect === "function") {
    const { height } = element.getBoundingClientRect();
    if (Number.isFinite(height) && height > 0) {
      return height;
    }
  }

  if (typeof element.offsetHeight === "number" && element.offsetHeight > 0) {
    return element.offsetHeight;
  }

  if (typeof element.scrollHeight === "number" && element.scrollHeight > 0) {
    return element.scrollHeight;
  }

  return MEASUREMENT_FALLBACK;
};

const requestFrame = (callback) => {
  if (!isBrowser) {
    return setTimeout(callback, 0);
  }
  if (typeof window.requestAnimationFrame === "function") {
    return window.requestAnimationFrame(callback);
  }
  return window.setTimeout(callback, 0);
};

const cancelFrame = (handle) => {
  if (!isBrowser) {
    clearTimeout(handle);
    return;
  }
  if (typeof window.cancelAnimationFrame === "function") {
    window.cancelAnimationFrame(handle);
    return;
  }
  window.clearTimeout(handle);
};

/**
 * 意图：将容器高度稳定在历史最大值，避免内容切换时的跳动。
 * 输入：
 *  - strategy: 高度聚合策略（默认 "retain-max"）。
 *  - dependencies: 触发重新测量的依赖键集合。
 * 输出：
 *  - containerRef: 需绑定到目标 DOM 的 ref。
 *  - style: 可直接应用在元素上的行内样式对象。
 *  - stableHeight: 当前聚合后的高度值（像素）。
 * 流程：
 *  1) 初始化 reducer 与依赖。
 *  2) 在 layout 阶段测量并根据策略更新高度。
 *  3) 监听 ResizeObserver，内容变化时重新测量并聚合。
 * 错误处理：
 *  - DOM 缺失或测量失败时短路，保持既有高度。
 * 复杂度：
 *  - 时间：O(1)；空间：O(1)。
 */
function useStableHeight({ strategy = "retain-max", dependencies } = {}) {
  const containerRef = useRef(null);
  const [stableHeight, setStableHeight] = useState(null);

  const reducer = useMemo(
    () => HEIGHT_STRATEGIES[strategy] ?? HEIGHT_STRATEGIES["retain-max"],
    [strategy],
  );

  const normalizedDependencies = useMemo(() => {
    if (!dependencies) {
      return [];
    }
    if (Array.isArray(dependencies)) {
      return dependencies;
    }
    return [dependencies];
  }, [dependencies]);

  const measureAndUpdate = useCallback(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const nextHeight = readElementHeight(element);
    if (!Number.isFinite(nextHeight) || nextHeight <= 0) {
      return;
    }
    setStableHeight((current) => {
      const resolved = reducer(current, nextHeight);
      if (resolved === current || !Number.isFinite(resolved)) {
        return current;
      }
      return resolved;
    });
  }, [reducer]);

  useLayoutEffect(() => {
    measureAndUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureAndUpdate, ...normalizedDependencies]);

  useEffect(() => {
    if (!isBrowser || typeof ResizeObserver !== "function") {
      return undefined;
    }
    const target = containerRef.current;
    if (!target) {
      return undefined;
    }

    let frameHandle = null;
    const observer = new ResizeObserver(() => {
      cancelFrame(frameHandle);
      frameHandle = requestFrame(measureAndUpdate);
    });

    observer.observe(target);

    return () => {
      cancelFrame(frameHandle);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureAndUpdate, ...normalizedDependencies]);

  const style = useMemo(() => {
    if (!Number.isFinite(stableHeight) || stableHeight === null) {
      return undefined;
    }
    const rounded = Math.max(0, Math.round(stableHeight));
    if (rounded === 0) {
      return undefined;
    }
    const value = `${rounded}px`;
    return { minHeight: value };
  }, [stableHeight]);

  return { containerRef, style, stableHeight };
}

export default useStableHeight;
