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
});
