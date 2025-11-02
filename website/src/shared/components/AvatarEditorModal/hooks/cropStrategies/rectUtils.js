/**
 * 背景：
 *  - 裁剪策略需共享矩形校验与误差度量逻辑，避免在各策略内重复实现导致行为漂移。
 * 目的：
 *  - 提供集中、可测试的矩形工具函数，服务于 CSS 矩阵策略与几何策略的统一输出。
 * 关键决策与取舍：
 *  - 使用最小依赖的纯函数，保障未来引入新的策略（旋转、镜像等）时可直接复用；
 *  - 保留误差度量函数便于策略管线做一致性校准，而非在业务代码中散落日志比较。
 * 影响范围：
 *  - AvatarEditorModal 裁剪参数解析流程；
 * 演进与TODO：
 *  - 后续可在此扩展更多矩形相关的数学工具（例如矩形联合、交集计算）。
 */

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
