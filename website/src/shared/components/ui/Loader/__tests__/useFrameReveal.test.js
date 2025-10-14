import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import useFrameReveal from "../useFrameReveal";

/**
 * 测试目标：验证 Hook 在首帧使用 requestAnimationFrame 显示覆盖层，随后按照给定间隔往复淡入/淡出。
 * 前置条件：伪造 requestAnimationFrame / cancelAnimationFrame 以及 setInterval / clearInterval 控制节奏。
 * 步骤：
 *  1) 渲染 Hook，记录首帧回调与间隔回调；
 *  2) 执行 requestAnimationFrame 回调，确认覆盖层出现；
 *  3) 触发间隔回调两次，观察可见态在 true/false 间循环；
 *  4) 切换帧 token，验证旧的动画帧与间隔任务被清理。
 * 断言：
 *  - 初始状态为 false，首帧回调执行后变为 true；
 *  - 间隔回调触发时布尔值交替；
 *  - rerender 时触发 cancelAnimationFrame 与 clearInterval。
 * 边界/异常：
 *  - 对 `prefers-reduced-motion` 的降级策略尚未覆盖，未来补充。
 */
describe("useFrameReveal", () => {
  const originalRequestAnimationFrame = global.requestAnimationFrame;
  const originalCancelAnimationFrame = global.cancelAnimationFrame;
  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;

  afterEach(() => {
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("GivenInterval_WhenCallbacksFired_ThenTogglesRevealState", () => {
    jest.useFakeTimers();
    let storedAnimationFrameCallback;
    let storedIntervalCallback;

    const raf = jest.fn((callback) => {
      storedAnimationFrameCallback = callback;
      return 11;
    });
    const cancel = jest.fn();
    const scheduleInterval = jest.fn((callback) => {
      storedIntervalCallback = callback;
      return 13;
    });
    const clearScheduledInterval = jest.fn();

    global.requestAnimationFrame = raf;
    global.cancelAnimationFrame = cancel;
    global.setInterval = scheduleInterval;
    global.clearInterval = clearScheduledInterval;

    const { result, rerender } = renderHook(
      ({ token, interval }) => useFrameReveal(token, { intervalMs: interval }),
      {
        initialProps: { token: "frame-a", interval: 700 },
      },
    );

    expect(result.current).toBe(false);
    expect(typeof storedAnimationFrameCallback).toBe("function");
    expect(typeof storedIntervalCallback).toBe("function");

    act(() => {
      storedAnimationFrameCallback();
    });

    expect(result.current).toBe(true);

    act(() => {
      storedIntervalCallback();
    });

    expect(result.current).toBe(false);

    act(() => {
      storedIntervalCallback();
    });

    expect(result.current).toBe(true);

    rerender({ token: "frame-b", interval: 700 });

    expect(cancel).toHaveBeenCalledWith(11);
    expect(clearScheduledInterval).toHaveBeenCalledWith(13);
  });
});
