import waitingRevealStrategy, {
  deriveRevealTiming,
} from "../waitingRevealStrategy";

/**
 * 测试目标：验证等待动画可见性策略输出 1 秒节奏，并在策略失效时退化为 Loader 周期。
 * 前置条件：直接调用推导函数，提供默认策略与模拟的回退策略。
 * 步骤：
 *  1) 调用 deriveRevealTiming 并传入默认周期；
 *  2) 调用 deriveRevealTiming 并传入非法策略，观察回退行为。
 * 断言：
 *  - 默认策略返回 intervalMs=1000、durationMs=1000；
 *  - 非法策略时 interval/duration 回落到周期 800ms。
 * 边界/异常：
 *  - 策略被置空时函数仍返回正值，后续若引入更多参数需补充断言。
 */

describe("waitingRevealStrategy", () => {
  it("GivenDefaultStrategy_WhenDeriving_ThenReturnOneSecondBreathing", () => {
    const timing = deriveRevealTiming(1500);
    expect(timing).toEqual({ intervalMs: 1000, durationMs: 1000 });
    expect(waitingRevealStrategy.fadeDurationMs).toBe(1000);
    expect(waitingRevealStrategy.oscillationIntervalMs).toBe(1000);
  });

  it("GivenInvalidStrategy_WhenDeriving_ThenFallbackToCycleDuration", () => {
    const faultyStrategy = Object.freeze({
      fadeDurationMs: Number.NaN,
      oscillationIntervalMs: -120,
    });
    const timing = deriveRevealTiming(800, faultyStrategy);
    expect(timing).toEqual({ intervalMs: 800, durationMs: 800 });
  });
});
