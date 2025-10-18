import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import useAvatarEditorController from "../hooks/useAvatarEditorController.js";

beforeEach(() => {
  global.ResizeObserver = undefined;
});

/**
 * 测试目标：验证缩放控制在上下限范围内。
 * 前置条件：初始状态下 open=true，使用默认参数。
 * 步骤：
 *  1) 渲染控制器 hook；
 *  2) 连续调用 handleZoomIn 超过上限次数；
 *  3) 调用 handleZoomOut 一次。
 * 断言：
 *  - 初始 isZoomOutDisabled 为 true；
 *  - 放大多次后 isZoomInDisabled 变为 true；
 *  - 再次缩小时 isZoomOutDisabled 变为 false。
 * 边界/异常：
 *  - 若未来调整缩放步长，应同步更新断言逻辑。
 */
test("Given controller lifecycle When toggling zoom Then boundaries are enforced", () => {
  const onConfirm = jest.fn();
  const { result } = renderHook(() =>
    useAvatarEditorController({ open: true, source: "", onConfirm, labels: undefined, isProcessing: false }),
  );

  expect(result.current.isZoomOutDisabled).toBe(true);

  act(() => {
    for (let i = 0; i < 20; i += 1) {
      result.current.handleZoomIn();
    }
  });

  expect(result.current.isZoomInDisabled).toBe(true);

  act(() => {
    result.current.handleZoomOut();
  });

  expect(result.current.isZoomOutDisabled).toBe(false);
});

/**
 * 测试目标：确认在无图片资源时不会触发 onConfirm。
 * 前置条件：imageRef.current 为空，open=true。
 * 步骤：
 *  1) 渲染控制器；
 *  2) 调用 handleConfirm。
 * 断言：
 *  - onConfirm 未被调用。
 * 边界/异常：
 *  - 当 future 引入占位图时需补充对应路径。
 */
test("Given missing image When confirming crop Then callback is skipped", async () => {
  const onConfirm = jest.fn();
  const { result } = renderHook(() =>
    useAvatarEditorController({ open: true, source: "", onConfirm, labels: undefined, isProcessing: false }),
  );

  await act(async () => {
    await result.current.handleConfirm();
  });

  expect(onConfirm).not.toHaveBeenCalled();
});
