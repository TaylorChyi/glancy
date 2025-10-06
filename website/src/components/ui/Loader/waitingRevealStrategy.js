/**
 * 背景：
 *  - 等待动画淡入淡出节奏此前散落在 Loader 组件内部，难以复用或按品牌节奏动态调整。
 * 目的：
 *  - 以策略模式集中声明淡入/淡出时长，并提供推导函数，根据策略输出稳定的动画参数。
 * 关键决策与取舍：
 *  - 默认使用 1 秒淡入 + 1 秒淡出的节奏，呼应最新的品牌体验要求；
 *  - 策略对象冻结，避免运行期被意外修改，同时暴露推导函数以便未来按需注入新策略；
 *  - 函数内保留回退逻辑，若策略被替换为非法值，仍能依据 Loader 周期生成合理参数。
 * 影响范围：
 *  - Loader 组件通过推导函数获取动画节奏；其它组件若复用等待动画也可引入该策略。
 * 演进与TODO：
 *  - TODO：引入特性开关或用户偏好，按无障碍需求缩放节奏；
 *  - TODO：结合 `prefers-reduced-motion` 在必要时退化为常显模式。
 */
const WAITING_REVEAL_STRATEGY = Object.freeze({
  fadeDurationMs: 1000,
  oscillationIntervalMs: 1000,
});

function ensurePositiveInteger(value) {
  if (!Number.isFinite(value)) {
    return null;
  }
  const rounded = Math.round(value);
  return rounded > 0 ? rounded : null;
}

/**
 * 意图：根据策略与 Loader 周期推导淡入淡出节奏。
 * 输入：
 *  - cycleDurationMs：Loader 底层帧切换周期，可为 undefined/负值；
 *  - strategy：可选策略对象，默认使用冻结常量。
 * 输出：
 *  - intervalMs：往复调度间隔；
 *  - durationMs：CSS 过渡时长。
 * 流程：
 *  1) 读取策略中的 oscillationIntervalMs，若非法则回落到 Loader 的周期；
 *  2) 读取策略中的 fadeDurationMs，若非法则与 interval 同步；
 *  3) 返回结构化的节奏参数。
 * 错误处理：策略参数非法时回退，不抛异常，以免影响加载体验。
 * 复杂度：常量时间与空间。
 */
export function deriveRevealTiming(
  cycleDurationMs,
  strategy = WAITING_REVEAL_STRATEGY,
) {
  const intervalFromStrategy = ensurePositiveInteger(
    strategy.oscillationIntervalMs,
  );
  const cycleFallback = ensurePositiveInteger(cycleDurationMs);
  const intervalMs = intervalFromStrategy ?? cycleFallback ?? 1000;

  const durationFromStrategy = ensurePositiveInteger(strategy.fadeDurationMs);
  const durationMs = durationFromStrategy ?? intervalMs;

  return {
    intervalMs,
    durationMs,
  };
}

export default WAITING_REVEAL_STRATEGY;
