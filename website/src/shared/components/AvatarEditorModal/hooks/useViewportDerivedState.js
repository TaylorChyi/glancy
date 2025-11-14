import { useCallback, useEffect, useMemo } from "react";
import {
  clampOffset,
  computeDisplayMetrics,
  computeOffsetBounds,
} from "@shared/utils/avatarCropBox.js";
import { composeTranslate3d } from "../utils.js";
import {
  ensureFiniteNumber,
  ensurePositiveNumber,
  getHalf,
  hasPositiveDimensions,
} from "./utils/viewportGuards.js";

const useDisplayMetrics = ({ naturalSize, viewportSize, zoom }) =>
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

const useOffsetBounds = ({ displayMetrics, viewportSize }) =>
  useMemo(
    () =>
      computeOffsetBounds(
        displayMetrics.width,
        displayMetrics.height,
        viewportSize,
      ),
    [displayMetrics.height, displayMetrics.width, viewportSize],
  );

const useOffsetAdjustments = ({ bounds, setOffset }) => {
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

const useImageTransform = ({
  displayMetrics,
  viewportSize,
  naturalSize,
  offset,
}) =>
  useMemo(() => {
    const safeViewport = ensureFiniteNumber(viewportSize, 0);
    const halfViewport = getHalf(safeViewport);
    const safeScale = ensurePositiveNumber(displayMetrics.scaleFactor, 1);
    const hasNaturalSize = hasPositiveDimensions({
      width: naturalSize.width,
      height: naturalSize.height,
    });
    const halfWidth = hasNaturalSize
      ? getHalf(ensureFiniteNumber(naturalSize.width, 0))
      : 0;
    const halfHeight = hasNaturalSize
      ? getHalf(ensureFiniteNumber(naturalSize.height, 0))
      : 0;
    const safeOffsetX = ensureFiniteNumber(offset.x, 0);
    const safeOffsetY = ensureFiniteNumber(offset.y, 0);

    return [
      composeTranslate3d(safeOffsetX, safeOffsetY),
      composeTranslate3d(halfViewport, halfViewport),
      `scale(${safeScale})`,
      composeTranslate3d(-halfWidth, -halfHeight),
    ].join(" ");
  }, [
    displayMetrics.scaleFactor,
    naturalSize.height,
    naturalSize.width,
    offset.x,
    offset.y,
    viewportSize,
  ]);

const useViewportDerivedState = ({
  naturalSize,
  viewportSize,
  zoom,
  offset,
  setOffset,
}) => {
  const displayMetrics = useDisplayMetrics({ naturalSize, viewportSize, zoom });
  const bounds = useOffsetBounds({ displayMetrics, viewportSize });
  const applyOffsetDelta = useOffsetAdjustments({ bounds, setOffset });
  const imageTransform = useImageTransform({
    displayMetrics,
    viewportSize,
    naturalSize,
    offset,
  });

  return { displayMetrics, bounds, applyOffsetDelta, imageTransform };
};

export default useViewportDerivedState;
