/**
 * 背景：
 *  - Loader 组件需要根据等待素材的原始尺寸与动画节奏动态构建 CSS 变量，旧实现将逻辑散落在组件内部不利于复用测试。
 * 目的：
 *  - 抽取纯函数 `buildWaitingSymbolStyle`，根据尺寸、淡入时长与素材引用拼装样式对象，便于单测与多组件共用。
 * 关键决策与取舍：
 *  - 将 `33vh` 与像素高度取 `min` 作为统一策略，兼容视口约束与设计稿像素值；
 *  - 通过 `toFixed(6)` 固定纵横比精度，避免浮点误差导致的渲染跳动；
 *  - 对入参做最小化校验，若尺寸非法直接抛出异常，阻止无效渲染。
 * 影响范围：
 *  - Loader 组件与潜在的等待动画调用方可共享此构建逻辑，测试覆盖面迁移至纯函数后更易维护。
 * 演进与TODO：
 *  - TODO：后续可引入主题化配置以调整高度上限或根据设备能力调整节奏参数。
 */
const WAITING_FRAME_HEIGHT_VH = "33vh";
const WAITING_FRAME_PRECISION = 6;

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
  return Number((dimensions.width / dimensions.height).toFixed(WAITING_FRAME_PRECISION));
}

export function buildWaitingSymbolStyle(dimensions, fadeDurationMs, frameImageValue) {
  assertValidDimensions(dimensions);
  const style = {
    "--waiting-frame-height": formatHeightLimit(dimensions.height),
    "--waiting-frame-aspect-ratio": computeAspectRatio(dimensions),
  };

  if (Number.isFinite(fadeDurationMs)) {
    style["--waiting-fade-duration"] = `${fadeDurationMs}ms`;
  }

  if (typeof frameImageValue === "string" && frameImageValue.length > 0) {
    style["--waiting-frame-image"] = frameImageValue;
  }

  return style;
}

export { computeAspectRatio };
