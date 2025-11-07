/**
 * 意图：判断矩形对象是否合法（存在且宽高为正）。
 * 输入：rect - 期待包含 x/y/width/height 的对象。
 * 输出：布尔值，指示是否满足合法性约束。
 * 流程：
 *  1) 校验对象存在；
 *  2) 逐项确认字段为有限数；
 *  3) 校验宽高大于零。
 */
export const isValidRect = (rect) =>
  Boolean(
    rect &&
      Number.isFinite(rect.x) &&
      Number.isFinite(rect.y) &&
      Number.isFinite(rect.width) &&
      Number.isFinite(rect.height) &&
      rect.width > 0 &&
      rect.height > 0,
  );

/**
 * 意图：衡量候选矩形与基准矩形之间的最大差异，用于策略输出的偏差诊断。
 * 输入：candidate/reference - 待比较的两个矩形；
 * 输出：返回四个分量差值中的最大绝对值，若任一非法则返回 Infinity。
 * 流程：
 *  1) 若任意矩形非法，直接返回 Infinity；
 *  2) 分别计算 x/y/width/height 的绝对差；
 *  3) 取最大值返回。
 */
export const measureRectDeviation = (candidate, reference) => {
  if (!isValidRect(candidate) || !isValidRect(reference)) {
    return Infinity;
  }
  return Math.max(
    Math.abs(candidate.x - reference.x),
    Math.abs(candidate.y - reference.y),
    Math.abs(candidate.width - reference.width),
    Math.abs(candidate.height - reference.height),
  );
};

export default {
  isValidRect,
  measureRectDeviation,
};
