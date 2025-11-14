import { useCallback, useEffect, useMemo } from "react";
import {
  clampOffset,
  computeDisplayMetrics,
  computeOffsetBounds,
} from "@shared/utils/avatarCropBox.js";
import { composeTranslate3d } from "../utils.js";

const getFiniteOrFallback = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

const getHalfDimension = (value) =>
  value > 0 && Number.isFinite(value) ? value / 2 : 0;

const getSafeScale = (scale) =>
  Number.isFinite(scale) && scale > 0 ? scale : 1;

const getSafeOffsetValue = (value) => (Number.isFinite(value) ? value : 0);

const buildImageTransform = ({
  displayMetrics,
  naturalSize,
  offset,
  viewportSize,
}) => {
  const safeViewport = getFiniteOrFallback(viewportSize);
  const halfViewport = safeViewport / 2;
  const safeScale = getSafeScale(displayMetrics.scaleFactor);
  const halfWidth = getHalfDimension(naturalSize.width);
  const halfHeight = getHalfDimension(naturalSize.height);
  const safeOffsetX = getSafeOffsetValue(offset.x);
  const safeOffsetY = getSafeOffsetValue(offset.y);

  return [
    composeTranslate3d(safeOffsetX, safeOffsetY),
    composeTranslate3d(halfViewport, halfViewport),
    `scale(${safeScale})`,
    composeTranslate3d(-halfWidth, -halfHeight),
  ].join(" ");
};

export const useDisplayMetricsMemo = ({ naturalSize, viewportSize, zoom }) =>
  useMemo(
    () =>
      computeDisplayMetrics({
        naturalWidth: naturalSize.width,
        naturalHeight: naturalSize.height,
        viewportSize,
        zoom,
      }),
    [naturalSize.height, naturalSize.width, viewportSize, zoom],
  );

export const useOffsetBoundsMemo = ({ displayMetrics, viewportSize }) =>
  useMemo(
    () =>
      computeOffsetBounds(
        displayMetrics.width,
        displayMetrics.height,
        viewportSize,
      ),
    [displayMetrics.height, displayMetrics.width, viewportSize],
  );

export const useOffsetDeltaHandler = ({ bounds, setOffset }) => {
  useEffect(() => {
    setOffset((previous) => clampOffset(previous, bounds));
  }, [bounds, setOffset]);

  return useCallback(
    (deltaX, deltaY) => {
      setOffset((previous) =>
        clampOffset({ x: previous.x + deltaX, y: previous.y + deltaY }, bounds),
      );
    },
    [bounds, setOffset],
  );
};

export const useImageTransformMemo = ({
  displayMetrics,
  viewportSize,
  naturalSize,
  offset,
}) =>
  useMemo(
    () =>
      buildImageTransform({
        displayMetrics,
        naturalSize,
        offset,
        viewportSize,
      }),
    [
      displayMetrics.scaleFactor,
      naturalSize.height,
      naturalSize.width,
      offset.x,
      offset.y,
      viewportSize,
    ],
  );

const useViewportDerivedState = ({
  naturalSize,
  viewportSize,
  zoom,
  offset,
  setOffset,
}) => {
  const displayMetrics = useDisplayMetricsMemo({
    naturalSize,
    viewportSize,
    zoom,
  });
  const bounds = useOffsetBoundsMemo({ displayMetrics, viewportSize });
  const applyOffsetDelta = useOffsetDeltaHandler({ bounds, setOffset });
  const imageTransform = useImageTransformMemo({
    displayMetrics,
    viewportSize,
    naturalSize,
    offset,
  });

  return { displayMetrics, bounds, applyOffsetDelta, imageTransform };
};

export default useViewportDerivedState;
