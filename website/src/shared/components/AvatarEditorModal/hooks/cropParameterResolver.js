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

const buildContext = ({
  imageRef,
  viewportSize,
  naturalSize,
  displayMetrics,
  offset,
}) => ({
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
