import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import useStableHeight from "../useStableHeight.js";

function TestPanel({ dependencyKey = "general" }) {
  const { containerRef, style } = useStableHeight({ dependencies: dependencyKey });

  return (
    <div
      ref={containerRef}
      data-testid="panel"
      role="tabpanel"
      style={style}
    >
      panel
    </div>
  );
}

describe("useStableHeight", () => {
  let originalResizeObserver;
  let resizeObservers;
  let currentHeight;
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;
  let boundingClientRectSpy;

  class MockResizeObserver {
    constructor(callback) {
      this.callback = callback;
      resizeObservers.push(this);
    }

    observe() {}

    disconnect() {}

    trigger(entries = []) {
      this.callback(entries);
    }
  }

  beforeEach(() => {
    resizeObservers = [];
    currentHeight = 200;
    originalResizeObserver = global.ResizeObserver;
    global.ResizeObserver = MockResizeObserver;

    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;
    window.requestAnimationFrame = (callback) => {
      callback();
      return 1;
    };
    window.cancelAnimationFrame = () => {};

    boundingClientRectSpy = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function mockGetBoundingClientRect() {
        return {
          width: 0,
          height: currentHeight,
          top: 0,
          left: 0,
          bottom: currentHeight,
          right: 0,
          toJSON() {
            return {};
          },
        };
      });
  });

  afterEach(() => {
    boundingClientRectSpy.mockRestore();
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    global.ResizeObserver = originalResizeObserver;
  });

  /**
   * 测试目标：初次渲染时根据面板内容高度设定最小高度。
   * 前置条件：模拟节点高度为 200px。
   * 步骤：渲染测试面板并等待样式写入。
   * 断言：panel.style.minHeight === "200px"。
   * 边界/异常：测量失败场景由下个用例间接覆盖。
   */
  test("Given_initial_render_When_measured_Then_sets_min_height_once", async () => {
    const { getByTestId } = render(<TestPanel dependencyKey="general" />);

    const panel = getByTestId("panel");
    await waitFor(() => {
      expect(panel.style.minHeight).toBe("200px");
    });
  });

  /**
   * 测试目标：内容高度增长时更新最小高度，收缩时维持最大值。
   * 前置条件：初始高度 200px，并监听 ResizeObserver 触发。
   * 步骤：
   *  1) 触发高度增长至 360px；
   *  2) 触发高度下降至 160px；
   *  3) 切换依赖键并增长至 420px；
   * 断言：
   *  - 步骤 1 后 minHeight 为 360px；
   *  - 步骤 2 后仍为 360px；
   *  - 步骤 3 后更新为 420px。
   * 边界/异常：覆盖分区切换时的重新测量流程。
   */
  test(
    "Given_dynamic_content_When_height_changes_Then_retains_and_expands_min_height",
    async () => {
      const { getByTestId, rerender } = render(
        <TestPanel dependencyKey="general" />,
      );

      const panel = getByTestId("panel");
      await waitFor(() => {
        expect(panel.style.minHeight).toBe("200px");
      });

      const firstObserver = resizeObservers.at(-1);
      expect(firstObserver).toBeTruthy();

      await act(async () => {
        currentHeight = 360;
        firstObserver.trigger();
      });
      expect(panel.style.minHeight).toBe("360px");

      await act(async () => {
        currentHeight = 160;
        firstObserver.trigger();
      });
      expect(panel.style.minHeight).toBe("360px");

      rerender(<TestPanel dependencyKey="account" />);
      await waitFor(() => {
        expect(panel.style.minHeight).toBe("360px");
      });

      const secondObserver = resizeObservers.at(-1);
      expect(secondObserver).toBeTruthy();

      await act(async () => {
        currentHeight = 420;
        secondObserver.trigger();
      });
      expect(panel.style.minHeight).toBe("420px");
    },
  );
});
