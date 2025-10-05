import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import useFrameReveal from "../useFrameReveal";

/**
 * 测试目标：验证灰度到黑色的过渡 Hook 能在帧切换时重置并于下一次绘制标记为展示态。
 * 前置条件：通过伪造的 requestAnimationFrame / cancelAnimationFrame 控制调度。
 * 步骤：
 *  1) 渲染 Hook，并记录 requestAnimationFrame 回调；
 *  2) 触发帧切换，验证状态重置；
 *  3) 手动执行回调，确认状态恢复为已展示。
 * 断言：
 *  - 初始状态为 false；
 *  - 回调执行后状态切换为 true；
 *  - 帧切换时会调用 cancelAnimationFrame 清理旧任务。
 * 边界/异常：
 *  - 若 requestAnimationFrame 不可用应回退至立即展示，当前未覆盖该分支。
 */
describe("useFrameReveal", () => {
  const originalRequestAnimationFrame = global.requestAnimationFrame;
  const originalCancelAnimationFrame = global.cancelAnimationFrame;

  beforeEach(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
    jest.clearAllMocks();
  });

  it("GivenFrameToken_WhenAnimationFrameRuns_ThenMarksAsRevealed", () => {
    let storedCallback;
    const raf = jest.fn((callback) => {
      storedCallback = callback;
      return 7;
    });
    const cancel = jest.fn();
    global.requestAnimationFrame = raf;
    global.cancelAnimationFrame = cancel;

    const { result, rerender } = renderHook(
      ({ token }) => useFrameReveal(token),
      {
        initialProps: { token: "frame-a" },
      },
    );

    expect(result.current).toBe(false);
    expect(typeof storedCallback).toBe("function");

    act(() => {
      storedCallback();
    });

    expect(result.current).toBe(true);

    rerender({ token: "frame-b" });

    expect(result.current).toBe(false);
    expect(cancel).toHaveBeenCalledWith(7);
  });
});
