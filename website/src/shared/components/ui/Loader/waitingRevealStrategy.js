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
