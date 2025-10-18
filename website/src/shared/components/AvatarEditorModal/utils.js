/**
 * 背景：
 *  - CSS 变换矩阵、 Canvas 初始化等工具方法原散布在组件中，
 *    逻辑耦合导致测试与跨文件复用困难。
 * 目的：
 *  - 下沉纯函数与副作用边界，形成“工具模块”供控制器与单测依赖。
 * 关键决策与取舍：
 *  - 维持零依赖纯函数（formatPixels/composeTranslate3d），
 *    并将最小副作用（ensureCanvas）隔离，便于未来替换为离屏 Canvas 或 WebGL。
 * 影响范围：
 *  - AvatarEditorModal 控制器及相关测试；
 *  - 未来若新增图片处理能力，可复用现有函数或在此扩展。
 * 演进与TODO：
 *  - 可在后续追加 transform 组合工具（例如旋转矩阵），维持统一语义。
 */

/**
 * 意图：格式化像素值，避免浮点误差导致 transform 出现 -0px 或科学计数法。
 * 输入：value - 任意数值，可能为 NaN/Infinity；
 * 输出：字符串形式的 px 单位。
 * 流程：
 *  1) 校验是否为有限数；
 *  2) 针对极小值归零，避免 -0；
 *  3) 返回带单位的字符串。
 * 错误处理：返回 "0px" 作为安全兜底；
 * 复杂度：O(1)。
 */
export const formatPixels = (value) => {
  if (!Number.isFinite(value)) {
    return "0px";
  }
  const rounded = Number(Math.abs(value) < 1e-4 ? 0 : value.toFixed(3));
  return `${Object.is(rounded, -0) ? 0 : rounded}px`;
};

/**
 * 意图：以统一方式构造 translate3d 字符串，保障矩阵顺序一致。
 * 输入：x/y 坐标（数值类型，允许浮点）；
 * 输出：标准化的 translate3d 字符串。
 * 流程：调用 formatPixels 格式化后拼接。
 */
export const composeTranslate3d = (x, y) =>
  `translate3d(${formatPixels(x)}, ${formatPixels(y)}, 0)`;

/**
 * 意图：生成用于绘制裁剪结果的 Canvas 元素。
 * 输入：无；
 * 输出：浏览器环境下的 HTMLCanvasElement。
 * 流程：调用 document.createElement，并保持可替换性以支持单测注入。
 */
export const ensureCanvas = () => document.createElement("canvas");
