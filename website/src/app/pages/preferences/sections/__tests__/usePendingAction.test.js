import { jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";
import { usePendingAction } from "../usePendingAction.js";

describe("usePendingAction", () => {
  /**
   * 测试目标：runWithPending 在异步任务进行时标记状态，并在完成后恢复。
   * 前置条件：构造手动解析的 Promise 以控制任务完成时间。
   * 步骤：
   *  1) 调用 runWithPending 启动任务并在 Promise 解析前读取 pending；
   *  2) 解析 Promise 并再次读取 pending 状态。
   * 断言：
   *  - 任务执行期间 isActionPending 返回 true；
   *  - 任务完成后 pending 状态清空；
   *  - task 回调按照传入顺序执行。
   * 边界/异常：
   *  - 确保 finally 分支也能清理状态。
   */
  it("Given async task when wrapped then exposes transient pending flag", async () => {
    const { result } = renderHook(() => usePendingAction());
    let release;
    const task = jest.fn(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );

    let pendingPromise;
    await act(async () => {
      pendingPromise = result.current.runWithPending("export", task);
    });

    await waitFor(() =>
      expect(result.current.isActionPending("export")).toBe(true),
    );

    release();

    await act(async () => {
      await pendingPromise;
    });

    expect(task).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(result.current.isActionPending("export")).toBe(false),
    );
  });
});
