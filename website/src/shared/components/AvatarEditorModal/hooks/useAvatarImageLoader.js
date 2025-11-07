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
