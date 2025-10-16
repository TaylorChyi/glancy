import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import useFrameReveal from "../useFrameReveal";

/**
 * 测试目标：
 *  - 验证 Hook 在首帧使用 requestAnimationFrame 显示覆盖层，随后按照给定间隔往复淡入/淡出；
 *  - 覆盖 `prefers-reduced-motion` 场景，确认降级为常量可见且可在偏好变更后恢复振荡。
 * 前置条件：伪造 requestAnimationFrame / cancelAnimationFrame、setInterval / clearInterval 以及 matchMedia。
 * 步骤：
 *  1) 渲染 Hook，记录首帧回调与间隔回调；
 *  2) 在减少动效偏好下执行首帧回调并确保未调度振荡；
 *  3) 模拟偏好恢复为默认值，观察重新调度振荡并可翻转可见态；
 *  4) 切换帧 token，验证旧的动画帧与间隔任务被清理。
 * 断言：
 *  - 初始状态为 false，首帧回调执行后变为 true；
 *  - 减少动效时不触发 setInterval；
 *  - 偏好恢复后重新调度振荡并可交替布尔值；
 *  - rerender 时触发 cancelAnimationFrame 与 clearInterval。
 * 边界/异常：
 *  - matchMedia 不可用时退化为原有行为（由基础测试覆盖）。
 */
describe("useFrameReveal", () => {
  const originalRequestAnimationFrame = global.requestAnimationFrame;
  const originalCancelAnimationFrame = global.cancelAnimationFrame;
  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;
  const originalMatchMedia = global.matchMedia;
  const originalWindowMatchMedia = typeof window !== "undefined" ? window.matchMedia : undefined;

  afterEach(() => {
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
    global.matchMedia = originalMatchMedia;
    if (typeof window !== "undefined") {
      window.matchMedia = originalWindowMatchMedia;
    }
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  /**
   * 测试目标：验证默认动效路径下首帧显隐与周期性翻转逻辑。
   * 前置条件：伪造 requestAnimationFrame/cancelAnimationFrame 与 setInterval/clearInterval。
   * 步骤：
   *  1) 渲染 Hook，记录首帧与间隔回调；
   *  2) 依次触发首帧回调与两次间隔回调；
   *  3) rerender 更新 token 以触发清理。
   * 断言：
   *  - 首帧回调执行前状态为 false，执行后为 true；
   *  - 间隔回调交替翻转布尔值；
   *  - rerender 时调用 cancelAnimationFrame 与 clearInterval。
   * 边界/异常：使用假的计时器以确保定时任务可控。
   */
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

  /**
   * 测试目标：验证减少动效偏好时保持常显，偏好恢复后重新调度振荡逻辑。
   * 前置条件：伪造 requestAnimationFrame/cancelAnimationFrame、setInterval/clearInterval 与 matchMedia。
   * 步骤：
   *  1) 在 reduce 偏好下渲染 Hook 并执行首帧回调；
   *  2) 断言未触发 setInterval，状态锁定为 true；
   *  3) 模拟偏好切换为默认值，校验重新调度间隔并可翻转状态；
   *  4) rerender 触发清理以确认旧任务被回收。
   * 断言：
   *  - 减少动效时 setInterval 未被调用；
   *  - 偏好恢复后触发 setInterval 并可切换布尔值；
   *  - rerender 时调用 cancelAnimationFrame 与 clearInterval。
   * 边界/异常：验证监听器注销由原始 afterEach 统一完成。
   */
  it("GivenReducedMotion_WhenPreferenceChanges_ThenLocksRevealAndRecoversOscillation", () => {
    jest.useFakeTimers();
    let storedAnimationFrameCallback;
    let storedIntervalCallback;

    const raf = jest.fn((callback) => {
      storedAnimationFrameCallback = callback;
      return 21;
    });
    const cancel = jest.fn();
    const scheduleInterval = jest.fn((callback) => {
      storedIntervalCallback = callback;
      return 31;
    });
    const clearScheduledInterval = jest.fn();

    global.requestAnimationFrame = raf;
    global.cancelAnimationFrame = cancel;
    global.setInterval = scheduleInterval;
    global.clearInterval = clearScheduledInterval;

    const changeListeners = new Set();
    const mediaQuery = {
      matches: true,
      addEventListener: (event, listener) => {
        if (event === "change") {
          changeListeners.add(listener);
        }
      },
      removeEventListener: (event, listener) => {
        if (event === "change") {
          changeListeners.delete(listener);
        }
      },
    };
    const matchMediaMock = jest.fn(() => mediaQuery);
    global.matchMedia = matchMediaMock;
    if (typeof window !== "undefined") {
      window.matchMedia = matchMediaMock;
    }

    const { result, rerender, unmount } = renderHook(({ token, interval }) =>
      useFrameReveal(token, { intervalMs: interval }),
      {
        initialProps: { token: "frame-reduced", interval: 500 },
      },
    );

    expect(result.current).toBe(true);
    expect(typeof storedAnimationFrameCallback).toBe("function");
    expect(scheduleInterval).not.toHaveBeenCalled();

    act(() => {
      storedAnimationFrameCallback();
    });

    expect(result.current).toBe(true);
    expect(scheduleInterval).not.toHaveBeenCalled();

    act(() => {
      mediaQuery.matches = false;
      changeListeners.forEach((listener) => {
        listener({ matches: false });
      });
    });

    expect(scheduleInterval).toHaveBeenCalledTimes(1);
    expect(typeof storedIntervalCallback).toBe("function");

    act(() => {
      storedIntervalCallback();
    });

    expect(result.current).toBe(false);

    rerender({ token: "frame-restored", interval: 500 });

    expect(cancel).toHaveBeenCalledWith(21);
    expect(clearScheduledInterval).toHaveBeenCalledWith(31);

    unmount();
  });
});
