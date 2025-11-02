/**
 * 背景：
 *  - 图片尺寸解析与 SVG 兜底逻辑原写在组件内部，异步控制散乱且不易测试。
 * 目的：
 *  - 封装图片加载与尺寸推导流程，统一处理 fetch/fallback/abort 等细节。
 * 关键决策与取舍：
 *  - 持续使用浏览器原生 fetch，避免引入额外依赖；
 *  - 通过 ref 保留最新 source，避免异步竞态导致状态过期。
 * 影响范围：
 *  - AvatarEditorModal 控制器。
 * 演进与TODO：
 *  - 后续可在此添加缓存或离线策略，减少重复拉取 SVG 的请求。
 */

import { useEffect, useMemo, useRef } from "react";
import { extractSvgIntrinsicSize } from "@shared/utils/svgIntrinsicSize.js";
import { DEFAULT_VIEWPORT_SIZE } from "../constants.js";

const applySize = ({
  size,
  viewport,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) => {
  setNaturalSize(size);
  if (shouldRecenterRef.current) {
    recenterViewport({
      naturalWidth: size.width,
      naturalHeight: size.height,
      viewport,
    });
  }
};

const fetchSvgContent = async ({ source, controller }) => {
  if (typeof fetch !== "function") {
    return null;
  }
  const response = await fetch(source, { signal: controller.signal });
  if (!response.ok) {
    return null;
  }
  return response.text();
};

const applyFallbackSize = ({
  fallbackViewport,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) => {
  applySize({
    size: { width: fallbackViewport, height: fallbackViewport },
    viewport: fallbackViewport,
    setNaturalSize,
    shouldRecenterRef,
    recenterViewport,
  });
};

const applySvgResult = ({
  svgText,
  fallbackViewport,
  viewportSize,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) => {
  const svgSize = extractSvgIntrinsicSize(svgText) ?? {
    width: fallbackViewport,
    height: fallbackViewport,
  };
  applySize({
    size: svgSize,
    viewport: viewportSize || fallbackViewport,
    setNaturalSize,
    shouldRecenterRef,
    recenterViewport,
  });
};

const handleSvgFetch = async ({
  source,
  controller,
  fallbackViewport,
  viewportSize,
  latestSourceRef,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) => {
  const svgText = await fetchSvgContent({ source, controller });
  if (!svgText) {
    applyFallbackSize({
      fallbackViewport,
      setNaturalSize,
      shouldRecenterRef,
      recenterViewport,
    });
    return;
  }
  if (controller.signal.aborted || latestSourceRef.current !== source) {
    return;
  }
  applySvgResult({
    svgText,
    fallbackViewport,
    viewportSize,
    setNaturalSize,
    shouldRecenterRef,
    recenterViewport,
  });
};

const createLoadHandler =
  ({
    source,
    viewportSize,
    fallbackSizeControllerRef,
    latestSourceRef,
    setNaturalSize,
    shouldRecenterRef,
    recenterViewport,
  }) =>
  async (event) => {
    const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
    if (width > 0 && height > 0) {
      applySize({
        size: { width, height },
        viewport: viewportSize,
        setNaturalSize,
        shouldRecenterRef,
        recenterViewport,
      });
      return;
    }

    if (!source) {
      setNaturalSize({ width: 0, height: 0 });
      return;
    }

    if (fallbackSizeControllerRef.current) {
      fallbackSizeControllerRef.current.abort();
    }

    const controller = new AbortController();
    fallbackSizeControllerRef.current = controller;
    latestSourceRef.current = source;
    const fallbackViewport = viewportSize || DEFAULT_VIEWPORT_SIZE;

    try {
      await handleSvgFetch({
        source,
        controller,
        fallbackViewport,
        viewportSize,
        latestSourceRef,
        setNaturalSize,
        shouldRecenterRef,
        recenterViewport,
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("avatar-editor-resolve-intrinsic-size", error);
      }
      applyFallbackSize({
        fallbackViewport,
        setNaturalSize,
        shouldRecenterRef,
        recenterViewport,
      });
    } finally {
      if (fallbackSizeControllerRef.current === controller) {
        fallbackSizeControllerRef.current = null;
      }
    }
  };

const useAvatarImageLoader = ({
  source,
  viewportSize,
  setNaturalSize,
  recenterViewport,
  shouldRecenterRef,
}) => {
  const fallbackSizeControllerRef = useRef(null);
  const latestSourceRef = useRef(source);

  const handleImageLoad = useMemo(
    () =>
      createLoadHandler({
        source,
        viewportSize,
        fallbackSizeControllerRef,
        latestSourceRef,
        setNaturalSize,
        shouldRecenterRef,
        recenterViewport,
      }),
    [recenterViewport, setNaturalSize, shouldRecenterRef, source, viewportSize],
  );

  useEffect(() => {
    latestSourceRef.current = source;
    return () => {
      if (fallbackSizeControllerRef.current) {
        fallbackSizeControllerRef.current.abort();
        fallbackSizeControllerRef.current = null;
      }
    };
  }, [source]);

  return { handleImageLoad };
};

export default useAvatarImageLoader;
