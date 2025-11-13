import { useCallback, useRef, useState } from "react";
import { deriveCenteredViewportState } from "@shared/utils/avatarCropBox.js";
import { DEFAULT_VIEWPORT_SIZE, MAX_ZOOM, MIN_ZOOM } from "../constants.js";
import { ensurePositiveFinite } from "./viewportMath.js";

const INITIAL_POINT = { x: 0, y: 0 };

const useViewportCoreState = () => {
  const shouldRecenterRef = useRef(true);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState(INITIAL_POINT);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState(DEFAULT_VIEWPORT_SIZE);

  const resetView = useCallback(() => {
    shouldRecenterRef.current = true;
    setZoom(MIN_ZOOM);
    setOffset(INITIAL_POINT);
  }, []);

  const recenterViewport = useCallback(
    ({
      naturalWidth,
      naturalHeight,
      viewport = viewportSize,
      zoom: targetZoom = MIN_ZOOM,
    }) => {
      const width = ensurePositiveFinite(naturalWidth);
      const height = ensurePositiveFinite(naturalHeight);
      const safeViewport = ensurePositiveFinite(viewport, viewportSize);
      if (!width || !height || !safeViewport) {
        return false;
      }
      const nextState = deriveCenteredViewportState({
        naturalWidth: width,
        naturalHeight: height,
        viewportSize: safeViewport,
        zoom: targetZoom,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      });
      setZoom(nextState.zoom);
      setOffset(nextState.offset);
      shouldRecenterRef.current = false;
      return true;
    },
    [viewportSize],
  );

  return {
    shouldRecenterRef,
    zoom,
    setZoom,
    offset,
    setOffset,
    naturalSize,
    setNaturalSize,
    viewportSize,
    setViewportSize,
    resetView,
    recenterViewport,
  };
};

export default useViewportCoreState;
