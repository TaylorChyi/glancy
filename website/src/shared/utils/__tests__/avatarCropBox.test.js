/**
 * 测试目标：验证 avatarCropBox 几何策略函数的边界行为与约束逻辑。
 * 前置条件：直接调用纯函数，无需模拟 DOM 或状态。
 * 步骤：
 *  1) 分别调用 computeCoverScale、computeDisplayMetrics、computeOffsetBounds 与 clampOffset；
 *  2) 覆盖正常输入与非法输入分支。
 * 断言：
 *  - 返回值精确匹配预期结果，断言失败需指明函数名与输入参数。
 * 边界/异常：
 *  - 包含零宽高、极值缩放与偏移超界的测试用例。
 */
import {
  clampOffset,
  clampZoom,
  computeCoverScale,
  computeCropSourceRect,
  computeDisplayMetrics,
  computeOffsetBounds,
  deriveCenteredViewportState,
} from "../avatarCropBox.js";

const createImageConfig = (overrides = {}) => ({
  naturalWidth: 800,
  naturalHeight: 600,
  viewportSize: 320,
  ...overrides,
});

const createViewportStateInput = (overrides = {}) => ({
  ...createImageConfig(),
  zoom: 1.6,
  minZoom: 1,
  maxZoom: 3,
  ...overrides,
});

const createCropRectInput = (overrides = {}) => ({
  ...createImageConfig(),
  scaleFactor: 1,
  offset: { x: 0, y: 0 },
  ...overrides,
});

describe("avatarCropBox geometry helpers", () => {
  describeComputeCoverScaleSuite();
  describeComputeDisplayMetricsSuite();
  describeComputeOffsetBoundsSuite();
  describeClampOffsetSuite();
  describeClampZoomSuite();
  describeDeriveCenteredViewportStateSuite();
  describeComputeCropSourceRectSuite();
});

function describeComputeCoverScaleSuite() {
  describe("computeCoverScale", () => {
    it("Given rectangular source When computeCoverScale Then returns covering ratio", () => {
      expect(computeCoverScale(400, 200, 300)).toBeCloseTo(1.5);
      expect(computeCoverScale(200, 400, 300)).toBeCloseTo(1.5);
    });

    it("Given invalid dimensions When computeCoverScale Then falls back to 1", () => {
      expect(computeCoverScale(0, 100, 300)).toBe(1);
      expect(computeCoverScale(100, -10, 300)).toBe(1);
      expect(computeCoverScale(100, 100, 0)).toBe(1);
    });
  });
}

function describeComputeDisplayMetricsSuite() {
  describe("computeDisplayMetrics", () => {
    it("Given zoom factor When computeDisplayMetrics Then returns scaled size", () => {
      const metrics = computeDisplayMetrics(
        createImageConfig({
          naturalWidth: 250,
          naturalHeight: 250,
          viewportSize: 250,
          zoom: 1.2,
        })
      );

      expect(metrics.scaleFactor).toBeCloseTo(1.2);
      expect(metrics.width).toBeCloseTo(300);
      expect(metrics.height).toBeCloseTo(300);
    });

    it("Given invalid zoom When computeDisplayMetrics Then returns safe defaults", () => {
      const metrics = computeDisplayMetrics(
        createImageConfig({
          naturalWidth: 200,
          naturalHeight: 200,
          viewportSize: 300,
          zoom: 0,
        })
      );

      expect(metrics.scaleFactor).toBe(1);
      expect(metrics.width).toBe(0);
      expect(metrics.height).toBe(0);
    });
  });
}

function describeComputeOffsetBoundsSuite() {
  describe("computeOffsetBounds", () => {
    it("Given display dimensions When computeOffsetBounds Then halves delta", () => {
      const bounds = computeOffsetBounds(360, 300, 300);

      expect(bounds.maxX).toBeCloseTo(30);
      expect(bounds.maxY).toBeCloseTo(0);
    });

    it("Given undersized image When computeOffsetBounds Then returns zero bounds", () => {
      const bounds = computeOffsetBounds(100, 100, 300);

      expect(bounds).toEqual({ maxX: 0, maxY: 0 });
    });
  });
}

function describeClampOffsetSuite() {
  describe("clampOffset", () => {
    it("Given offset outside bounds When clampOffset Then returns clamped vector", () => {
      const clamped = clampOffset({ x: 120, y: -200 }, { maxX: 30, maxY: 50 });

      expect(clamped).toEqual({ x: 30, y: -50 });
    });
  });
}

function describeClampZoomSuite() {
  describe("clampZoom", () => {
    it("Given zoom outside limits When clampZoom Then clamps accordingly", () => {
      expect(clampZoom(5, 1, 3)).toBe(3);
      expect(clampZoom(0.5, 1, 3)).toBe(1);
      expect(clampZoom(2, 1, 3)).toBe(2);
    });
  });
}

function describeDeriveCenteredViewportStateSuite() {
  describe("deriveCenteredViewportState", () => {
    /**
     * 测试目标：验证 deriveCenteredViewportState 会输出以图片中心为原点的偏移与合法缩放值。
     * 前置条件：提供 1200×800 的原图，视窗为 320，期望缩放 1.6，缩放上下限为 [1, 3]。
     * 步骤：
     *  1) 调用 deriveCenteredViewportState 并获取返回值；
     * 断言：
     *  - zoom 保持在 1.6；
     *  - offset 为 {x:0,y:0}；
     *  - bounds.maxX 与 bounds.maxY 大于 0；
     * 边界/异常：
     *  - 覆盖横向大图场景。
     */
    it("Given rectangular source When deriveCenteredViewportState Then centers offset", () => {
      const state = deriveCenteredViewportState(
        createViewportStateInput({
          naturalWidth: 1200,
          naturalHeight: 800,
        })
      );

      expect(state.zoom).toBeCloseTo(1.6);
      expect(state.offset).toEqual({ x: 0, y: 0 });
      expect(state.bounds.maxX).toBeGreaterThan(0);
      expect(state.bounds.maxY).toBeGreaterThan(0);
    });

    /**
     * 测试目标：验证 deriveCenteredViewportState 在尺寸非法时仍返回零偏移且缩放被钳制至下限。
     * 前置条件：视窗或尺寸为非正值，期望缩放为 2。
     * 步骤：
     *  1) 调用 deriveCenteredViewportState，分别传入零尺寸与零视窗；
     * 断言：
     *  - zoom 等于钳制后的 2；
     *  - offset 为 {x:0,y:0}；
     *  - bounds 为 {maxX:0,maxY:0}；
     * 边界/异常：
     *  - 覆盖异常输入场景。
     */
    it("Given invalid dimensions When deriveCenteredViewportState Then returns origin offset", () => {
      const zeroSizeState = deriveCenteredViewportState(
        createViewportStateInput({
          naturalWidth: 0,
          zoom: 2,
        })
      );

      expect(zeroSizeState.zoom).toBe(2);
      expect(zeroSizeState.offset).toEqual({ x: 0, y: 0 });
      expect(zeroSizeState.bounds).toEqual({ maxX: 0, maxY: 0 });

      const zeroViewportState = deriveCenteredViewportState(
        createViewportStateInput({
          viewportSize: 0,
          zoom: 2,
        })
      );

      expect(zeroViewportState.zoom).toBe(2);
      expect(zeroViewportState.offset).toEqual({ x: 0, y: 0 });
      expect(zeroViewportState.bounds).toEqual({ maxX: 0, maxY: 0 });
    });
  });
}

function describeComputeCropSourceRectSuite() {
  describe("computeCropSourceRect", () => {
    /**
     * 测试目标：验证 computeCropSourceRect 在默认居中场景下计算正确矩形。
     * 前置条件：原图 800×600，视窗 320×320，缩放系数覆盖视窗且无平移。
     * 步骤：
     *  1) 调用 computeCropSourceRect 传入居中偏移；
     * 断言：
     *  - 宽高等于 600，x=100，y=0（允许浮点误差）。
     * 边界/异常：
     *  - 无额外边界。
     */
    it("Given centered state When computeCropSourceRect Then derives middle square", () => {
      const { scaleFactor } = computeDisplayMetrics(createImageConfig({ zoom: 1 }));
      const rect = computeCropSourceRect(createCropRectInput({ scaleFactor }));

      expect(rect.width).toBeCloseTo(600);
      expect(rect.height).toBeCloseTo(600);
      expect(rect.x).toBeCloseTo(100);
      expect(rect.y).toBeCloseTo(0);
    });

    /**
     * 测试目标：验证 computeCropSourceRect 会将平移后的矩形钳制在原图边界内。
     * 前置条件：沿 X 轴平移至极限，其他参数同上。
     * 步骤：
     *  1) 使用最大平移量计算裁剪矩形；
     * 断言：
     *  - x 被钳制为 0，width 不变，y 仍为 0。
     * 边界/异常：
     *  - 覆盖极限平移场景。
     */
    it("Given extreme offset When computeCropSourceRect Then clamps to image bounds", () => {
      const { scaleFactor, width } = computeDisplayMetrics(createImageConfig({ zoom: 1 }));
      const { maxX } = computeOffsetBounds(width, 320, 320);
      const rect = computeCropSourceRect(
        createCropRectInput({
          scaleFactor,
          offset: { x: maxX, y: 0 },
        })
      );

      expect(rect.x).toBeCloseTo(0);
      expect(rect.width).toBeCloseTo(600);
      expect(rect.y).toBeCloseTo(0);
    });
  });
}
