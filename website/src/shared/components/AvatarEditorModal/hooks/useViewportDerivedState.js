/**
 * 背景：
 *  - 视口几何推导逻辑原内嵌在 useAvatarViewportModel 中，导致函数复杂度与文件行数超标。
 * 目的：
 *  - 将 displayMetrics、偏移边界与 transform 计算抽离，方便独立测试与复用。
 * 关键决策与取舍：
 *  - 保持纯函数 hook（仅依赖输入 state 与 setOffset）；
 *  - 统一通过 composeTranslate3d 生成 transform，避免展示层直接拼字符串。
 * 影响范围：
 *  - AvatarEditorModal 中的缩放与偏移渲染。
 * 演进与TODO：
 *  - 后续若加入旋转/镜像参数，可在此扩展 transform 组合逻辑。
 */

import { useCallback, useEffect, useMemo } from "react";
import {
  clampOffset,
  computeDisplayMetrics,
  computeOffsetBounds,
} from "@shared/utils/avatarCropBox.js";
import { composeTranslate3d } from "../utils.js";

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
    const safeViewport = Number.isFinite(viewportSize) ? viewportSize : 0;
    const halfViewport = safeViewport / 2;
    const safeScale =
      Number.isFinite(displayMetrics.scaleFactor) &&
      displayMetrics.scaleFactor > 0
        ? displayMetrics.scaleFactor
        : 1;
    const halfWidth =
      naturalSize.width > 0 && Number.isFinite(naturalSize.width)
        ? naturalSize.width / 2
        : 0;
    const halfHeight =
      naturalSize.height > 0 && Number.isFinite(naturalSize.height)
        ? naturalSize.height / 2
        : 0;
    const safeOffsetX = Number.isFinite(offset.x) ? offset.x : 0;
    const safeOffsetY = Number.isFinite(offset.y) ? offset.y : 0;

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
