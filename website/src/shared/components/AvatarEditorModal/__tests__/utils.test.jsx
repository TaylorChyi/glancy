import { composeTranslate3d, ensureCanvas, formatPixels } from "../utils.js";

/**
 * 测试目标：formatPixels 在极值场景下的输出格式。
 * 前置条件：输入包含非有限数与极小值。
 * 步骤：
 *  1) 调用 formatPixels(Infinity)；
 *  2) 调用 formatPixels(-0.0000001)。
 * 断言：
 *  - 非有限数返回 "0px"；
 *  - 极小负值归零且不出现 "-0px"。
 * 边界/异常：
 *  - 允许未来按需调整精度阈值。
 */
test("Given unsafe numeric inputs When formatting pixels Then values are normalized", () => {
  expect(formatPixels(Infinity)).toBe("0px");
  expect(formatPixels(-0.0000001)).toBe("0px");
});

/**
 * 测试目标：composeTranslate3d 输出顺序与单位正确。
 * 前置条件：输入浮点坐标 (10.5, -2)。
 * 步骤：
 *  1) 调用 composeTranslate3d(10.5, -2)；
 * 断言：
 *  - 返回字符串包含格式化后的像素值，顺序为 translate3d(x, y, 0)。
 * 边界/异常：
 *  - 未来扩展 Z 轴时需更新断言。
 */
test("Given numeric offsets When composing transform Then translate3d string is stable", () => {
  expect(composeTranslate3d(10.5, -2)).toBe("translate3d(10.5px, -2px, 0)");
});

/**
 * 测试目标：ensureCanvas 返回可绘制的 Canvas 元素。
 * 前置条件：JSDOM 环境。
 * 步骤：
 *  1) 调用 ensureCanvas();
 * 断言：
 *  - 返回元素 nodeName 为 CANVAS；
 *  - 可访问 getContext 方法。
 * 边界/异常：
 *  - 若未来引入 OffscreenCanvas，需要调整判断方式。
 */
test("Given DOM environment When requesting canvas Then a drawable node is created", () => {
  const canvas = ensureCanvas();
  expect(canvas.nodeName).toBe("CANVAS");
  expect(typeof canvas.getContext).toBe("function");
});
