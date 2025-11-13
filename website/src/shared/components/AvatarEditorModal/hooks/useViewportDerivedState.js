import { useCallback, useEffect, useMemo } from "react";
import {
  clampOffset,
  computeDisplayMetrics,
  computeOffsetBounds,
} from "@shared/utils/avatarCropBox.js";
import { composeTranslate3d } from "../utils.js";
import {
  ensureFinite,
  ensurePositiveFinite,
  halveIfPositive,
} from "./viewportMath.js";

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
    const safeViewport = ensurePositiveFinite(viewportSize);
    const halfViewport = halveIfPositive(safeViewport);
    const safeScale = ensurePositiveFinite(displayMetrics.scaleFactor, 1);
    const halfWidth = halveIfPositive(naturalSize.width);
    const halfHeight = halveIfPositive(naturalSize.height);
    const safeOffsetX = ensureFinite(offset.x);
    const safeOffsetY = ensureFinite(offset.y);

    return [
      composeTranslate3d(safeOffsetX, safeOffsetY),
      composeTranslate3d(halfViewport, halfViewport),
      `scale(${safeScale || 1})`,
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
