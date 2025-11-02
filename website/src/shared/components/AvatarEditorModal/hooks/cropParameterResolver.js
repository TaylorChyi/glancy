/**
 * 背景：
 *  - 裁剪参数解析需同时考虑 DOM 实际渲染与内部几何状态，原有单文件实现在扩展策略后行数超限。
 * 目的：
 *  - 调度 CSS 矩阵与几何两套策略，优先信任浏览器渲染结果，并在必要时发出偏差诊断告警。
 * 关键决策与取舍：
 *  - 采用“策略链 + 诊断校准”模式，便于未来追加旋转等策略时按需扩展；
 *  - 优先返回 CSS 矩阵求解结果，确保缩放/拖拽后的导出区域与用户所见一致；
 *  - 当策略存在显著差异时输出 console.warn，协助定位样式或状态异常。
 * 影响范围：
 *  - AvatarEditorModal 裁剪导出流程；
 * 演进与TODO：
 *  - 可继续在策略数组中插入更多变换支持，或将诊断上报接入可观测性系统。
 */

import cssMatrixStrategy, {
  CSS_MATRIX_STRATEGY_ID,
} from "./cropStrategies/cssMatrixStrategy.js";
import geometryStrategy, {
  GEOMETRY_STRATEGY_ID,
} from "./cropStrategies/geometryStrategy.js";
import {
  isValidRect,
  measureRectDeviation,
} from "./cropStrategies/rectUtils.js";

const MATRIX_TOLERANCE_PX = 0.5;

const STRATEGY_PIPELINE = Object.freeze([cssMatrixStrategy, geometryStrategy]);

const buildContext = ({ imageRef, viewportSize, naturalSize, displayMetrics, offset }) => ({
  image: imageRef?.current ?? null,
  viewportSize,
  naturalWidth: naturalSize?.width ?? 0,
  naturalHeight: naturalSize?.height ?? 0,
  displayMetrics,
  offset,
});

const aggregateEvaluations = (context) =>
  STRATEGY_PIPELINE.reduce((accumulator, strategy) => {
    const outcome = strategy.execute(context);
    if (outcome && isValidRect(outcome.cropRect)) {
      accumulator.push(outcome);
    }
    return accumulator;
  }, []);

const selectPreferredResult = ({ evaluations, viewportSize, naturalSize }) => {
  const cssMatrixResult = evaluations.find(
    (entry) => entry.strategy === CSS_MATRIX_STRATEGY_ID,
  );
  const geometryResult = evaluations.find(
    (entry) => entry.strategy === GEOMETRY_STRATEGY_ID,
  );

  if (cssMatrixResult && geometryResult) {
    const deviation = measureRectDeviation(
      cssMatrixResult.cropRect,
      geometryResult.cropRect,
    );

    if (
      deviation > MATRIX_TOLERANCE_PX &&
      typeof console !== "undefined" &&
      typeof console.warn === "function"
    ) {
      console.warn("avatar-editor-crop-mismatch", {
        deviation,
        viewportSize,
        naturalWidth: naturalSize.width,
        naturalHeight: naturalSize.height,
      });
    }

    return cssMatrixResult;
  }

  return cssMatrixResult ?? geometryResult ?? null;
};

const resolveCropParameters = ({
  imageRef,
  displayMetrics,
  viewportSize,
  naturalSize,
  offset,
}) => {
  const context = buildContext({
    imageRef,
    viewportSize,
    naturalSize,
    displayMetrics,
    offset,
  });

  const evaluations = aggregateEvaluations(context);
  if (evaluations.length === 0) {
    return null;
  }

  return selectPreferredResult({
    evaluations,
    viewportSize,
    naturalSize,
  });
};

export default resolveCropParameters;
