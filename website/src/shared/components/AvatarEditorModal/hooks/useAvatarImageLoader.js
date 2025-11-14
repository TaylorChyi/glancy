import { useEffect, useMemo, useRef } from "react";
import { extractSvgIntrinsicSize } from "@shared/parsers/svgIntrinsicSize.js";
import { DEFAULT_VIEWPORT_SIZE } from "../constants.js";
import { hasPositiveDimensions, isPositiveNumber } from "./utils/viewportGuards.js";

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

const resolveSvgSize = ({ svgText, fallbackViewport, viewportSize }) => {
  const size = extractSvgIntrinsicSize(svgText);
  const finalSize =
    size && hasPositiveDimensions(size)
      ? size
      : { width: fallbackViewport, height: fallbackViewport };
  const viewport = isPositiveNumber(viewportSize)
    ? viewportSize
    : fallbackViewport;

  return { size: finalSize, viewport };
};

const applySvgResult = ({
  svgText,
  fallbackViewport,
  viewportSize,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) => {
  const { size, viewport } = resolveSvgSize({
    svgText,
    fallbackViewport,
    viewportSize,
  });
  applySize({
    size,
    viewport,
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

const finalizeController = ({ fallbackSizeControllerRef, controller }) => {
  if (fallbackSizeControllerRef.current === controller) {
    fallbackSizeControllerRef.current = null;
  }
};

const logAndFallback = ({
  error,
  fallbackViewport,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) => {
  if (error.name !== "AbortError") {
    console.error("avatar-editor-resolve-intrinsic-size", error);
  }
  applyFallbackSize({
    fallbackViewport,
    setNaturalSize,
    shouldRecenterRef,
    recenterViewport,
  });
};

const resolveFallbackIntrinsicSize = async ({
  source,
  viewportSize,
  fallbackSizeControllerRef,
  latestSourceRef,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) => {
  if (fallbackSizeControllerRef.current) {
    fallbackSizeControllerRef.current.abort();
  }

  const controller = new AbortController();
  fallbackSizeControllerRef.current = controller;
  latestSourceRef.current = source;
  const fallbackViewport = isPositiveNumber(viewportSize)
    ? viewportSize
    : DEFAULT_VIEWPORT_SIZE;

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
    logAndFallback({
      error,
      fallbackViewport,
      setNaturalSize,
      shouldRecenterRef,
      recenterViewport,
    });
  } finally {
    finalizeController({ fallbackSizeControllerRef, controller });
  }
};

const readIntrinsicSize = (event) => ({
  width: event.currentTarget.naturalWidth,
  height: event.currentTarget.naturalHeight,
});

const handleLoadFailure = async ({
  source,
  viewportSize,
  fallbackSizeControllerRef,
  latestSourceRef,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) => {
  if (!source) {
    setNaturalSize({ width: 0, height: 0 });
    return;
  }

  await resolveFallbackIntrinsicSize({
    source,
    viewportSize,
    fallbackSizeControllerRef,
    latestSourceRef,
    setNaturalSize,
    shouldRecenterRef,
    recenterViewport,
  });
};

const handleLoadSuccess = ({
  size,
  viewportSize,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) => {
  applySize({
    size,
    viewport: viewportSize,
    setNaturalSize,
    shouldRecenterRef,
    recenterViewport,
  });
};

const createLoadHandler = ({
  source,
  viewportSize,
  fallbackSizeControllerRef,
  latestSourceRef,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
}) =>
  async (event) => {
    const size = readIntrinsicSize(event);
    if (hasPositiveDimensions(size)) {
      handleLoadSuccess({
        size,
        viewportSize,
        setNaturalSize,
        shouldRecenterRef,
        recenterViewport,
      });
      return;
    }

    await handleLoadFailure({
      source,
      viewportSize,
      fallbackSizeControllerRef,
      latestSourceRef,
      setNaturalSize,
      shouldRecenterRef,
      recenterViewport,
    });
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
