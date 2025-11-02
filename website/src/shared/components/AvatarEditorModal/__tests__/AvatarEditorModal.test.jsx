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
import { jest } from "@jest/globals";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { computeCropSourceRect } from "@shared/utils/avatarCropBox.js";
import { DEFAULT_VIEWPORT_SIZE } from "../constants.js";

let AvatarEditorModal;
let renderCroppedAvatar;

jest.unstable_mockModule("../hooks/avatarCropRenderer.js", () => ({
  __esModule: true,
  default: jest.fn(() =>
    Promise.resolve({
      blob: new Blob(["mock"], { type: "image/png" }),
      previewUrl: "blob:mock",
    }),
  ),
}));

beforeAll(async () => {
  ({ default: AvatarEditorModal } = await import("../index.jsx"));
  ({ default: renderCroppedAvatar } = await import(
    "../hooks/avatarCropRenderer.js"
  ));
});

const parseTranslate3d = (value) => {
  const regex = /translate3d\(([-\d.]+)px, ([-\d.]+)px, 0\)/g;
  return Array.from(value.matchAll(regex), ([, x, y]) => ({
    x: Number(x),
    y: Number(y),
  }));
};

const parseScale = (value) => {
  const match = value.match(/scale\(([-\d.]+)\)/);
  return match ? Number(match[1]) : 1;
};

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

afterEach(() => {
  renderCroppedAvatar.mockClear();
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
   * 测试目标：首次加载图片后视口应立即回到中心，避免出现初始偏移残留。
   * 前置条件：模态已打开，传入固定 source；图片尺寸为 1280×720。
   * 步骤：
   *  1) 渲染组件；
   *  2) 触发 load 事件并注入 naturalWidth/naturalHeight；
   * 断言：
   *  - transform 立即包含 translate3d(0px, 0px, 0) 而无需等待异步钳制；
   *  - scale 等于视窗与最短边之比，确保不会出现透明边缘。
   * 边界/异常：
   *  - 本用例覆盖首次打开场景，无异常分支。
   */
  it("Given first image When load event fires Then viewport centers instantly", () => {
    const { getByAltText } = render(<AvatarEditorModal {...baseProps} />);
    const image = getByAltText("avatar-preview");

    loadImage(image, { width: 1280, height: 720 });

    const translations = parseTranslate3d(image.style.transform);
    const scale = parseScale(image.style.transform);
    const expectedScale = DEFAULT_VIEWPORT_SIZE / 720;

    expect(translations[0]).toEqual({ x: 0, y: 0 });
    expect(translations[1].x).toBeCloseTo(translations[1].y, 3);
    expect(translations[1].x).toBeGreaterThan(0);
    expect(translations[2].x).toBeLessThan(0);
    expect(translations[2].y).toBeLessThan(0);
    expect(scale).toBeCloseTo(expectedScale, 6);
  });

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

    expect(parseTranslate3d(image.style.transform)[0]).not.toEqual({
      x: 0,
      y: 0,
    });

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
      expect(parseTranslate3d(updatedImage.style.transform)[0]).toEqual({
        x: 0,
        y: 0,
      });
    });
  });

  /**
   * 测试目标：确认拖拽与缩放后的裁剪参数与视口状态一致，避免导出区域与用户所见不一致。
   * 前置条件：图片尺寸 1200×800，进行一次平移与放大操作。
   * 步骤：
   *  1) 触发 load 事件设置图片尺寸；
   *  2) 模拟一次拖拽与一次放大操作；
   *  3) 点击确认按钮，等待裁剪流程完成。
   * 断言：
   *  - renderCroppedAvatar 收到的 cropRect 与几何工具计算结果一致；
   *  - image 引用与预期一致。
   * 边界/异常：
   *  - 覆盖常规拖拽与缩放组合路径，无异常分支。
   */
  it("Given drag and zoom When confirming Then crop rect matches viewport state", async () => {
    renderCroppedAvatar.mockResolvedValueOnce({
      blob: new Blob(["crop"], { type: "image/png" }),
      previewUrl: "blob:crop",
    });

    const { getByAltText, getByLabelText, getByRole, getByText } = render(
      <AvatarEditorModal {...baseProps} />,
    );

    const viewport = getByLabelText(DEFAULT_LABELS.title);
    const image = getByAltText("avatar-preview");

    loadImage(image, { width: 1200, height: 800 });

    act(() => {
      fireEvent.pointerDown(viewport, {
        pointerId: 4,
        clientX: 160,
        clientY: 160,
      });
      fireEvent.pointerMove(viewport, {
        pointerId: 4,
        clientX: 200,
        clientY: 190,
      });
      fireEvent.pointerUp(viewport, { pointerId: 4 });
    });

    act(() => {
      fireEvent.click(getByRole("button", { name: DEFAULT_LABELS.zoomIn }));
    });

    await act(async () => {
      fireEvent.click(getByText(DEFAULT_LABELS.confirm));
    });

    expect(renderCroppedAvatar).toHaveBeenCalledTimes(1);
    const [{ cropRect, image: croppedImage }] =
      renderCroppedAvatar.mock.calls[0];
    expect(croppedImage).toBe(image);

    const viewportSize = DEFAULT_VIEWPORT_SIZE;
    const transforms = parseTranslate3d(image.style.transform);
    const [offset] = transforms;
    const scaleFactor = parseScale(image.style.transform);

    const expectedRect = computeCropSourceRect({
      naturalWidth: 1200,
      naturalHeight: 800,
      viewportSize,
      scaleFactor,
      offset,
    });

    expect(cropRect.x).toBeCloseTo(expectedRect.x, 3);
    expect(cropRect.y).toBeCloseTo(expectedRect.y, 3);
    expect(cropRect.width).toBeCloseTo(expectedRect.width, 3);
    expect(cropRect.height).toBeCloseTo(expectedRect.height, 3);
  });
});
