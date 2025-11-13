import { useEffect, useMemo, useRef } from "react";
import { extractSvgIntrinsicSize } from "@shared/parsers/svgIntrinsicSize.js";
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

const extractSvgSize = (svgText, fallbackViewport) =>
  extractSvgIntrinsicSize(svgText) ?? {
    width: fallbackViewport,
    height: fallbackViewport,
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

const applySvgResult = ({
  svgText,
  fallbackViewport,
  viewportSize,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) => {
  const svgSize = extractSvgSize(svgText, fallbackViewport);
  applySize({
    size: svgSize,
    viewport: viewportSize || fallbackViewport,
    setNaturalSize,
    shouldRecenterRef,
    recenterViewport,
  });
};

const abortPreviousController = (fallbackSizeControllerRef) => {
  if (fallbackSizeControllerRef.current) {
    fallbackSizeControllerRef.current.abort();
  }
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

const handleSvgResolutionError = ({
  error,
  fallbackViewport,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) => {
  if (error?.name !== "AbortError") {
    console.error("avatar-editor-resolve-intrinsic-size", error);
  }
  applyFallbackSize({
    fallbackViewport,
    setNaturalSize,
    shouldRecenterRef,
    recenterViewport,
  });
};

const cleanupFallbackController = ({ fallbackSizeControllerRef, controller }) => {
  if (fallbackSizeControllerRef.current === controller) {
    fallbackSizeControllerRef.current = null;
  }
};

const handleKnownDimensions = ({
  width,
  height,
  viewportSize,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) => {
  if (width <= 0 || height <= 0) {
    return false;
  }
  applySize({
    size: { width, height },
    viewport: viewportSize,
    setNaturalSize,
    shouldRecenterRef,
    recenterViewport,
  });
  return true;
};

const handleMissingSource = ({ source, setNaturalSize }) => {
  if (source) {
    return false;
  }
  setNaturalSize({ width: 0, height: 0 });
  return true;
};

const resolveFallbackDimensions = async ({
  source,
  viewportSize,
  fallbackSizeControllerRef,
  latestSourceRef,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) => {
  abortPreviousController(fallbackSizeControllerRef);

  const controller = new AbortController();
  const fallbackViewport = viewportSize || DEFAULT_VIEWPORT_SIZE;

  fallbackSizeControllerRef.current = controller;
  latestSourceRef.current = source;

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
    handleSvgResolutionError({
      error,
      fallbackViewport,
      setNaturalSize,
      shouldRecenterRef,
      recenterViewport,
    });
  } finally {
    cleanupFallbackController({ fallbackSizeControllerRef, controller });
  }
};

const handleImageLoadEvent = async ({
  event,
  source,
  viewportSize,
  fallbackSizeControllerRef,
  latestSourceRef,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) => {
  const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
  if (
    handleKnownDimensions({
      width,
      height,
      viewportSize,
      setNaturalSize,
      shouldRecenterRef,
      recenterViewport,
    })
  ) {
    return;
  }

  if (handleMissingSource({ source, setNaturalSize })) {
    return;
  }

  await resolveFallbackDimensions({
    source,
    viewportSize,
    fallbackSizeControllerRef,
    latestSourceRef,
    setNaturalSize,
    shouldRecenterRef,
    recenterViewport,
  });
};

const createLoadHandler = (dependencies) =>
  async (event) =>
    handleImageLoadEvent({
      event,
      ...dependencies,
    });

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
