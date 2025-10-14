import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import useWaitingFrameCycle from "../useWaitingFrameCycle";

/**
 * 测试目标：验证等待帧 Hook 能根据随机数生成器输出正确的初始帧，并在动画迭代后切换素材。
 * 前置条件：提供包含三帧素材的数组以及可控的随机函数序列。
 * 步骤：
 *  1) 通过 renderHook 渲染 useWaitingFrameCycle，并注入自定义随机序列。
 *  2) 读取初始 currentFrame，模拟动画迭代事件。
 * 断言：
 *  - 初始帧与随机序列首个值匹配；
 *  - handleCycleComplete 被调用后返回新的帧且不与上一帧重复。
 * 边界/异常：
 *  - 随机函数命中上一帧索引时，Hook 应回退到下一合法帧。
 */
describe("useWaitingFrameCycle", () => {
  const frames = ["frame-a.svg", "frame-b.svg", "frame-c.svg"];

  it("GivenRandomSequence_WhenInitialised_ThenUsesFirstRandomValue", () => {
    const randomValues = [0.6];
    const { result } = renderHook(() =>
      useWaitingFrameCycle(frames, {
        random: () => randomValues.shift() ?? 0,
        autoStart: false,
      }),
    );

    expect(result.current.currentFrame).toBe("frame-b.svg");
  });

  it("GivenAnimationIteration_WhenRandomRepeatsIndex_ThenFallsBackToNextFrame", () => {
    const randomValues = [0.4, 0.4];
    const { result } = renderHook(() =>
      useWaitingFrameCycle(frames, {
        random: () => randomValues.shift() ?? 0,
        autoStart: false,
      }),
    );

    expect(result.current.currentFrame).toBe("frame-b.svg");

    act(() => {
      result.current.handleCycleComplete();
    });

    expect(result.current.currentFrame).toBe("frame-c.svg");
  });

  it("GivenSingleFramePool_WhenIterating_ThenKeepsReturningSameFrame", () => {
    const singleFrame = ["only-frame.svg"];
    const { result } = renderHook(() =>
      useWaitingFrameCycle(singleFrame, {
        random: () => 0.9,
        autoStart: false,
      }),
    );

    expect(result.current.currentFrame).toBe("only-frame.svg");

    act(() => {
      result.current.handleCycleComplete();
    });

    expect(result.current.currentFrame).toBe("only-frame.svg");
  });

  it("GivenCustomScheduler_WhenAutoStartEnabled_ThenInvokesAndCleansUp", () => {
    const randomValues = [0.1, 0.8];
    let scheduledCallback;
    const scheduler = jest.fn((callback) => {
      scheduledCallback = callback;
      return 42;
    });
    const cancel = jest.fn();

    const { result } = renderHook(() =>
      useWaitingFrameCycle(frames, {
        random: () => randomValues.shift() ?? 0,
        scheduler,
        cancel,
      }),
    );

    expect(result.current.currentFrame).toBe("frame-a.svg");
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(typeof scheduledCallback).toBe("function");

    act(() => {
      scheduledCallback();
    });

    expect(cancel).toHaveBeenCalledWith(42);
    expect(scheduler).toHaveBeenCalledTimes(2);
    expect(result.current.currentFrame).toBe("frame-c.svg");
  });

  it("GivenSingleFramePool_WhenUsingDefaultOptions_ThenSkipsScheduling", () => {
    /**
     * 测试目标：单帧模式下默认关闭调度，避免 requestAnimationFrame 被无意义触发。
     * 前置条件：仅提供一个素材帧，并注入可观察调用次数的 scheduler。
     * 步骤：
     *  1) 通过 renderHook 渲染 useWaitingFrameCycle，传入单帧数组与自定义 scheduler。
     *  2) 读取 currentFrame 并确认 scheduler 未被调用。
     * 断言：
     *  - currentFrame 返回唯一素材；
     *  - scheduler 保持零调用次数。
     * 边界/异常：
     *  - 单帧场景无需重置动画，因此若触发调度应视为失败。
     */
    const scheduler = jest.fn();
    const cancel = jest.fn();
    const singleFrame = ["solo-frame.svg"];

    const { result } = renderHook(() =>
      useWaitingFrameCycle(singleFrame, {
        random: () => 0.4,
        scheduler,
        cancel,
      }),
    );

    expect(result.current.currentFrame).toBe("solo-frame.svg");
    expect(scheduler).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  it("GivenMultiFramePool_WhenSchedulingDisabled_ThenNeverEnqueuesTimer", () => {
    /**
     * 测试目标：覆盖 shouldSchedule=false 分支，确认多帧素材在禁用调度时不会排程。
     * 前置条件：提供两帧素材、自定义 scheduler/cancel 以追踪调用次数。
     * 步骤：
     *  1) 渲染 Hook 并显式传入 shouldSchedule=false；
     *  2) 读取 currentFrame 并检查 scheduler/cancel 调用计数。
     * 断言：
     *  - scheduler 与 cancel 均未被调用；
     *  - Hook 仍返回首帧用于静态展示。
     * 边界/异常：
     *  - 若未来重新引入调度，应更新该测试以匹配新的节奏策略。
     */
    const scheduler = jest.fn();
    const cancel = jest.fn();

    const { result } = renderHook(() =>
      useWaitingFrameCycle(frames, {
        random: () => 0.1,
        scheduler,
        cancel,
        shouldSchedule: false,
      }),
    );

    expect(result.current.currentFrame).toBe("frame-a.svg");
    expect(scheduler).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  it("GivenStrategyConfiguration_WhenReadingCycleDuration_ThenReturnsFixedInterval", () => {
    /**
     * 测试目标：确认 Hook 返回的 cycleDurationMs 与策略文件设定的 1500ms 常量一致。
     * 前置条件：提供至少两帧素材以启用调度逻辑，但禁用自动调度避免副作用。
     * 步骤：
     *  1) 渲染 Hook 并传入 autoStart=false；
     *  2) 读取返回的 cycleDurationMs。
     * 断言：
     *  - cycleDurationMs 恰为 1500；
     *  - 行为与等待策略定义保持同步。
     * 边界/异常：
     *  - 若策略值调整，该测试提醒同步更新 Hook 或策略文件。
     */
    const { result } = renderHook(() =>
      useWaitingFrameCycle(frames, {
        random: () => 0.2,
        autoStart: false,
      }),
    );

    expect(result.current.cycleDurationMs).toBe(1500);
  });
});
