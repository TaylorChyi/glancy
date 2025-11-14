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
  if (!shouldRecenterRef.current) {
    return;
  }
  recenterViewport({
    naturalWidth: size.width,
    naturalHeight: size.height,
    viewport,
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

const handleSvgFetch = async (config) => {
  const svgText = await fetchSvgContent(config);
  if (!svgText) {
    applyFallbackSize(config);
    return;
  }
  if (
    config.controller.signal.aborted ||
    config.latestSourceRef.current !== config.source
  ) {
    return;
  }
  applySvgResult({ svgText, ...config });
};

export const getFallbackViewport = (viewportSize) =>
  viewportSize || DEFAULT_VIEWPORT_SIZE;

export const abortFallbackRequest = ({ fallbackSizeControllerRef }) => {
  if (!fallbackSizeControllerRef.current) {
    return;
  }
  fallbackSizeControllerRef.current.abort();
  fallbackSizeControllerRef.current = null;
};

const ensureImageSource = ({ source, setNaturalSize }) => {
  if (source) {
    return true;
  }
  setNaturalSize({ width: 0, height: 0 });
  return false;
};

const attachFallbackController = ({
  fallbackSizeControllerRef,
  latestSourceRef,
  source,
}) => {
  const controller = new AbortController();
  fallbackSizeControllerRef.current = controller;
  latestSourceRef.current = source;
  return controller;
};

const handleSvgResolutionError = ({
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

const cleanupFallbackController = ({
  fallbackSizeControllerRef,
  controller,
}) => {
  if (fallbackSizeControllerRef.current === controller) {
    fallbackSizeControllerRef.current = null;
  }
};

const fetchWithFallback = async (config) => {
  try {
    await handleSvgFetch(config);
  } catch (error) {
    handleSvgResolutionError({
      error,
      fallbackViewport: config.fallbackViewport,
      setNaturalSize: config.setNaturalSize,
      shouldRecenterRef: config.shouldRecenterRef,
      recenterViewport: config.recenterViewport,
    });
  } finally {
    cleanupFallbackController({
      fallbackSizeControllerRef: config.fallbackSizeControllerRef,
      controller: config.controller,
    });
  }
};

const createSvgSizeResolver = (config) =>
  async () => {
    abortFallbackRequest({
      fallbackSizeControllerRef: config.fallbackSizeControllerRef,
    });
    if (!ensureImageSource(config)) {
      return;
    }
    const controller = attachFallbackController({
      fallbackSizeControllerRef: config.fallbackSizeControllerRef,
      latestSourceRef: config.latestSourceRef,
      source: config.source,
    });
    await fetchWithFallback({ ...config, controller });
  };

export const createAvatarImageLoadHandler = (config) => {
  const fallbackViewport = getFallbackViewport(config.viewportSize);
  const resolveSvgSize = createSvgSizeResolver({
    ...config,
    fallbackViewport,
  });

  return async (event) => {
    const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
    if (width > 0 && height > 0) {
      applySize({
        size: { width, height },
        viewport: config.viewportSize,
        setNaturalSize: config.setNaturalSize,
        shouldRecenterRef: config.shouldRecenterRef,
        recenterViewport: config.recenterViewport,
      });
      return;
    }

    await resolveSvgSize();
  };
};
