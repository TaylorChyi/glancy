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
  computeDisplayMetrics,
  computeOffsetBounds,
} from "../avatarCropBox.js";

describe("avatarCropBox geometry helpers", () => {
  it("Given rectangular source When computeCoverScale Then returns covering ratio", () => {
    expect(computeCoverScale(400, 200, 300)).toBeCloseTo(1.5);
    expect(computeCoverScale(200, 400, 300)).toBeCloseTo(1.5);
  });

  it("Given invalid dimensions When computeCoverScale Then falls back to 1", () => {
    expect(computeCoverScale(0, 100, 300)).toBe(1);
    expect(computeCoverScale(100, -10, 300)).toBe(1);
    expect(computeCoverScale(100, 100, 0)).toBe(1);
  });

  it("Given zoom factor When computeDisplayMetrics Then returns scaled size", () => {
    const metrics = computeDisplayMetrics({
      naturalWidth: 250,
      naturalHeight: 250,
      viewportSize: 250,
      zoom: 1.2,
    });
    expect(metrics.scaleFactor).toBeCloseTo(1.2);
    expect(metrics.width).toBeCloseTo(300);
    expect(metrics.height).toBeCloseTo(300);
  });

  it("Given invalid zoom When computeDisplayMetrics Then returns safe defaults", () => {
    const metrics = computeDisplayMetrics({
      naturalWidth: 200,
      naturalHeight: 200,
      viewportSize: 300,
      zoom: 0,
    });
    expect(metrics.scaleFactor).toBe(1);
    expect(metrics.width).toBe(0);
    expect(metrics.height).toBe(0);
  });

  it("Given display dimensions When computeOffsetBounds Then halves delta", () => {
    const bounds = computeOffsetBounds(360, 300, 300);
    expect(bounds.maxX).toBeCloseTo(30);
    expect(bounds.maxY).toBeCloseTo(0);
  });

  it("Given undersized image When computeOffsetBounds Then returns zero bounds", () => {
    const bounds = computeOffsetBounds(100, 100, 300);
    expect(bounds).toEqual({ maxX: 0, maxY: 0 });
  });

  it("Given offset outside bounds When clampOffset Then returns clamped vector", () => {
    const clamped = clampOffset({ x: 120, y: -200 }, { maxX: 30, maxY: 50 });
    expect(clamped).toEqual({ x: 30, y: -50 });
  });

  it("Given zoom outside limits When clampZoom Then clamps accordingly", () => {
    expect(clampZoom(5, 1, 3)).toBe(3);
    expect(clampZoom(0.5, 1, 3)).toBe(1);
    expect(clampZoom(2, 1, 3)).toBe(2);
  });
});
