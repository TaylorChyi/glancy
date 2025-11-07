const WAITING_FRAME_HEIGHT_VH = "33vh";
const WAITING_FRAME_PRECISION = 6;
// 设计权衡：24px 羽化宽度可兼顾桌面与移动端，必要时可提炼为主题配置。
const WAITING_REVEAL_FEATHER_PX = 24;
// 确保遮罩在放大后完全覆盖素材，避免因 rounding 截断边缘。
const WAITING_REVEAL_VISIBLE_SCALE_FLOOR = 130;

function assertValidDimensions(dimensions) {
  if (!dimensions || typeof dimensions !== "object") {
    throw new TypeError("dimensions 必须为包含 width/height 的对象");
  }
  const { width, height } = dimensions;
  if (!Number.isFinite(width) || !Number.isFinite(height) || height === 0) {
    throw new TypeError("dimensions.width/height 需为有限且 height 非零的数值");
  }
}

function formatHeightLimit(heightPx) {
  return `min(${WAITING_FRAME_HEIGHT_VH}, ${heightPx}px)`;
}

function computeAspectRatio(dimensions) {
  return Number(
    (dimensions.width / dimensions.height).toFixed(WAITING_FRAME_PRECISION),
  );
}

/**
 * 意图：依据素材尺寸推导淡入淡出边界的羽化宽度与遮罩放大倍数。
 * 输入：Loader 素材的像素宽高，需为有限正数。
 * 输出：用于 CSS 变量的百分比字符串，分别代表羽化比例与遮罩放大倍率。
 * 流程：
 *  1) 以较短边作为基准，得到半径后计算羽化像素所占的比例；
 *  2) 对比例设置上限与下限，保证大屏不至于过度锐利，小屏也不会糊成一团；
 *  3) 根据比例推导遮罩放大倍数，确保动画结束时不会截断素材边缘。
 * 错误处理：若尺寸非法，回退到保守的默认值，避免运行时抛错影响加载体验。
 * 复杂度：常量时间与空间。
 */
function computeRevealSoftness(dimensions) {
  const minSide = Math.min(dimensions.width, dimensions.height);
  if (!Number.isFinite(minSide) || minSide <= 0) {
    return {
      softnessPercent: "12%",
      visibleScalePercent: "140%",
    };
  }

  const radius = minSide / 2;
  const normalizedFeather = Math.min(WAITING_REVEAL_FEATHER_PX / radius, 0.45);
  const softnessPercentValue = Math.max(normalizedFeather * 100, 8);
  const visibleScalePercentValue = Math.max(
    WAITING_REVEAL_VISIBLE_SCALE_FLOOR,
    Math.round(100 + normalizedFeather * 100),
  );

  return {
    softnessPercent: `${softnessPercentValue.toFixed(2)}%`,
    visibleScalePercent: `${visibleScalePercentValue}%`,
  };
}

export function buildWaitingSymbolStyle(
  dimensions,
  fadeDurationMs,
  frameImageValue,
) {
  assertValidDimensions(dimensions);
  const style = {
    "--waiting-frame-height": formatHeightLimit(dimensions.height),
    "--waiting-frame-aspect-ratio": computeAspectRatio(dimensions),
  };

  const {
    softnessPercent: revealSoftness,
    visibleScalePercent: revealVisibleScale,
  } = computeRevealSoftness(dimensions);

  style["--waiting-reveal-softness"] = revealSoftness;
  style["--waiting-reveal-mask-visible-size"] = revealVisibleScale;

  if (Number.isFinite(fadeDurationMs)) {
    style["--waiting-fade-duration"] = `${fadeDurationMs}ms`;
  }

  if (typeof frameImageValue === "string" && frameImageValue.length > 0) {
    style["--waiting-frame-image"] = frameImageValue;
  }

  return style;
}

export { computeAspectRatio };
