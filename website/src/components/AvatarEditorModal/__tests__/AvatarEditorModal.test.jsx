/**
 * 背景：
 *  - 头像裁剪模态此前出现新图片初始偏移残留，手动拖动亦可能无法回到中心位置。
 * 目的：
 *  - 验证用户拖动与重新加载图片时视口能自动回到中心，防止交互卡死。
 * 关键决策与取舍：
 *  - 采用真实组件渲染 + pointer 事件模拟，优先覆盖手势回中与文件切换两个回归场景。
 * 影响范围：
 *  - AvatarEditorModal 组件；其余模块不受影响。
 * 演进与TODO：
 *  - TODO: 后续可补充多指触控与键盘辅助交互的测试用例。
 */
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import AvatarEditorModal from "../index.jsx";

const DEFAULT_LABELS = Object.freeze({
  title: "Avatar viewport",
  description: "Drag to adjust",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  cancel: "Cancel",
  confirm: "Confirm",
});

let originalResizeObserver;
let originalSetPointerCapture;
let originalReleasePointerCapture;

beforeAll(() => {
  class MockResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
  }
  originalResizeObserver = window.ResizeObserver;
  window.ResizeObserver = MockResizeObserver;
  originalSetPointerCapture = HTMLElement.prototype.setPointerCapture;
  originalReleasePointerCapture = HTMLElement.prototype.releasePointerCapture;
  HTMLElement.prototype.setPointerCapture = () => {};
  HTMLElement.prototype.releasePointerCapture = () => {};
});

afterAll(() => {
  window.ResizeObserver = originalResizeObserver;
  HTMLElement.prototype.setPointerCapture = originalSetPointerCapture;
  HTMLElement.prototype.releasePointerCapture = originalReleasePointerCapture;
});

const baseProps = Object.freeze({
  open: true,
  source: "blob:first",
  onCancel: () => {},
  onConfirm: () => {},
  labels: DEFAULT_LABELS,
});

function loadImage(element, { width, height }) {
  Object.defineProperty(element, "naturalWidth", {
    value: width,
    configurable: true,
  });
  Object.defineProperty(element, "naturalHeight", {
    value: height,
    configurable: true,
  });
  fireEvent.load(element);
}

describe("AvatarEditorModal viewport interactions", () => {
  /**
   * 测试目标：验证切换到新图片后视口会自动居中。
   * 前置条件：先拖拽形成偏移，再更新 source 并触发 onLoad。
   * 步骤：
   *  1) 完成一次拖拽形成 translate3d(40px, 0px, 0)；
   *  2) rerender 传入新的 source，并触发 load；
   * 断言：
   *  - 新的 transform 恢复 translate3d(0px, 0px, 0)；
   * 边界/异常：
   *  - 覆盖同尺寸图片的切换。
   */
  it("Given new source When image reloads Then viewport recenters", async () => {
    const { getByAltText, getByLabelText, rerender } = render(
      <AvatarEditorModal {...baseProps} />,
    );
    const viewport = getByLabelText(DEFAULT_LABELS.title);
    const image = getByAltText("avatar-preview");

    loadImage(image, { width: 1200, height: 800 });

    act(() => {
      fireEvent.pointerDown(viewport, {
        pointerId: 2,
        clientX: 160,
        clientY: 160,
      });
      fireEvent.pointerMove(viewport, {
        pointerId: 2,
        clientX: 200,
        clientY: 160,
      });
      fireEvent.pointerUp(viewport, { pointerId: 2 });
    });

    expect(image.style.transform).not.toContain("translate3d(0px, 0px, 0)");

    rerender(
      <AvatarEditorModal
        {...baseProps}
        source="blob:second"
        labels={DEFAULT_LABELS}
      />,
    );
    const updatedImage = getByAltText("avatar-preview");

    loadImage(updatedImage, { width: 1200, height: 800 });

    await waitFor(() => {
      expect(updatedImage.style.transform).toContain(
        "translate3d(0px, 0px, 0)",
      );
    });
  });
});
