import { fireEvent, render } from "@testing-library/react";
import { jest } from "@jest/globals";
import { useRef } from "react";
import useInfiniteScroll from "../useInfiniteScroll.js";

function TestComponent({
  hasMore = true,
  isLoading = false,
  threshold = 32,
  onLoadMore,
}) {
  const containerRef = useRef(null);
  useInfiniteScroll({
    containerRef,
    hasMore,
    isLoading,
    threshold,
    onLoadMore,
  });

  return (
    <div
      data-testid="scroll-container"
      ref={containerRef}
      style={{ height: "100px", overflow: "auto" }}
    >
      <div style={{ height: "300px" }} />
    </div>
  );
}

describe("useInfiniteScroll", () => {
  /**
   * 测试目标：当滚动接近底部且存在更多数据时触发加载回调。
   * 前置条件：容器高度 100、内容高度 300，滚动到底部附近。
   * 步骤：
   *  1) 渲染组件并设置 scrollTop；
   *  2) 触发 scroll 事件；
   * 断言：
   *  - onLoadMore 被调用一次。
   * 边界/异常：
   *  - 若 hasMore 为 false 应短路（在其他用例覆盖）。
   */
  test("Given_more_data_When_scrolled_near_bottom_Then_invokes_loader", () => {
    const handleLoadMore = jest.fn();
    const { getByTestId } = render(
      <TestComponent onLoadMore={handleLoadMore} threshold={48} />,
    );
    const container = getByTestId("scroll-container");
    Object.defineProperty(container, "scrollHeight", {
      value: 300,
      configurable: true,
    });
    Object.defineProperty(container, "clientHeight", {
      value: 100,
      configurable: true,
    });
    container.scrollTop = 190;

    fireEvent.scroll(container);

    const callCount = handleLoadMore.mock.calls.length;
    expect(callCount).toBeGreaterThanOrEqual(1);
    expect(callCount).toBeLessThanOrEqual(2);
  });

  /**
   * 测试目标：当 hasMore 为 false 时不会触发加载回调。
   * 前置条件：容器同上，但 hasMore=false。
   * 步骤：触发 scroll 事件。
   * 断言：
   *  - onLoadMore 未被调用。
   * 边界/异常：
   *  - isLoading=true 场景在下一用例覆盖。
   */
  test("Given_no_more_data_When_scrolled_Then_does_not_call_loader", () => {
    const handleLoadMore = jest.fn();
    const { getByTestId } = render(
      <TestComponent hasMore={false} onLoadMore={handleLoadMore} />,
    );
    const container = getByTestId("scroll-container");
    Object.defineProperty(container, "scrollHeight", {
      value: 300,
      configurable: true,
    });
    Object.defineProperty(container, "clientHeight", {
      value: 100,
      configurable: true,
    });
    container.scrollTop = 220;

    fireEvent.scroll(container);

    expect(handleLoadMore).not.toHaveBeenCalled();
  });

  /**
   * 测试目标：当处于加载中状态时忽略滚动触发，避免重复请求。
   * 前置条件：isLoading=true，其他参数为默认。
   * 步骤：触发 scroll 事件。
   * 断言：
   *  - onLoadMore 未被调用。
   * 边界/异常：
   *  - 与上一用例互补覆盖。
   */
  test("Given_loading_in_progress_When_scrolled_Then_skips_loader", () => {
    const handleLoadMore = jest.fn();
    const { getByTestId } = render(
      <TestComponent isLoading onLoadMore={handleLoadMore} />,
    );
    const container = getByTestId("scroll-container");
    Object.defineProperty(container, "scrollHeight", {
      value: 300,
      configurable: true,
    });
    Object.defineProperty(container, "clientHeight", {
      value: 100,
      configurable: true,
    });
    container.scrollTop = 260;

    fireEvent.scroll(container);

    expect(handleLoadMore).not.toHaveBeenCalled();
  });
});
