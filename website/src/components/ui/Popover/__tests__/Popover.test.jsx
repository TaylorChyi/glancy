import { render, waitFor, cleanup } from "@testing-library/react";
import { jest } from "@jest/globals";
import { useRef } from "react";
import Popover from "../Popover.jsx";

function toDomRect({ top = 0, left = 0, width = 0, height = 0 }) {
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

function TestHarness({ placement, fallbackPlacements, offset, align }) {
  const anchorRef = useRef(null);
  return (
    <>
      <div data-testid="anchor" ref={anchorRef}>
        anchor
      </div>
      <Popover
        isOpen
        anchorRef={anchorRef}
        placement={placement}
        fallbackPlacements={fallbackPlacements}
        offset={offset}
        align={align}
        className="qa-popover"
      >
        <div>content</div>
      </Popover>
    </>
  );
}

beforeAll(() => {
  global.ResizeObserver =
    global.ResizeObserver ||
    class {
      observe() {}

      unobserve() {}

      disconnect() {}
    };
});

beforeEach(() => {
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: 600,
  });
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: 1024,
  });
  window.requestAnimationFrame = (callback) => {
    callback();
    return 0;
  };
  window.cancelAnimationFrame = () => {};
});

afterEach(() => {
  jest.restoreAllMocks();
  cleanup();
});

/**
 * 测试目标：验证在顶部空间充足时 Popover 采用主方向。
 * 前置条件：窗口高度足够且锚点距离顶部有 200px 以上。
 * 步骤：
 *  1) 渲染带有顶部候选及底部兜底的 Popover。
 *  2) 注入锚点与浮层尺寸后等待定位完成。
 * 断言：
 *  - data-placement 应为 top；若失败提示未保持顶部定位。
 * 边界/异常：
 *  - 顶部空间充足场景，互补场景在回退测试中覆盖。
 */
test("respects primary top placement when headroom is sufficient", async () => {
  const anchorBox = toDomRect({ top: 200, left: 100, width: 80, height: 40 });
  const popoverBox = toDomRect({ top: 0, left: 0, width: 140, height: 120 });
  const defaultRect = toDomRect({});
  jest
    .spyOn(Element.prototype, "getBoundingClientRect")
    .mockImplementation(function getBoundingClientRect() {
      if (this.dataset?.testid === "anchor") {
        return anchorBox;
      }
      if (this.classList?.contains("qa-popover")) {
        return popoverBox;
      }
      return defaultRect;
    });

  render(
    <TestHarness
      placement="top"
      fallbackPlacements={[]}
      offset={12}
      align="start"
    />,
  );

  await waitFor(() => {
    const popover = document.querySelector(".qa-popover");
    expect(popover).not.toBeNull();
    expect(popover?.getAttribute("data-placement")).toBe("top");
    expect(parseFloat(popover?.style.top ?? "0")).toBeCloseTo(68);
  });
});

/**
 * 测试目标：验证顶部空间不足时能够自动回退到底部方向。
 * 前置条件：锚点距顶部仅 40px，主方向为 top，提供 bottom 作为候选。
 * 步骤：
 *  1) 渲染 Popover 并注入导致顶部越界的尺寸。
 *  2) 等待定位结果。
 * 断言：
 *  - data-placement 应为 bottom，top 样式应为 92px；失败提示未触发回退。
 * 边界/异常：
 *  - 顶部空间不足；若所有候选均失败则维持默认策略。
 */
test("falls back to bottom placement when top overflows viewport", async () => {
  const anchorBox = toDomRect({ top: 40, left: 100, width: 80, height: 40 });
  const popoverBox = toDomRect({ top: 0, left: 0, width: 140, height: 120 });
  const defaultRect = toDomRect({});
  jest
    .spyOn(Element.prototype, "getBoundingClientRect")
    .mockImplementation(function getBoundingClientRect() {
      if (this.dataset?.testid === "anchor") {
        return anchorBox;
      }
      if (this.classList?.contains("qa-popover")) {
        return popoverBox;
      }
      return defaultRect;
    });

  render(
    <TestHarness
      placement="top"
      fallbackPlacements={["bottom"]}
      offset={12}
      align="start"
    />,
  );

  await waitFor(() => {
    const popover = document.querySelector(".qa-popover");
    expect(popover).not.toBeNull();
    expect(popover?.getAttribute("data-placement")).toBe("bottom");
    expect(parseFloat(popover?.style.top ?? "0")).toBeCloseTo(92);
  });
});

