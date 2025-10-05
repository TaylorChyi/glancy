/* eslint-env jest */
import React from "react";
import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AvatarCropperModal from "../AvatarCropperModal.jsx";

const buildCopy = () => ({
  title: "调整头像",
  subtitle: "拖动以调整取景框",
  orientation: "请确保头像方向正确",
  cancel: "取消",
  confirm: "确认",
  zoomIn: "放大",
  zoomOut: "缩小",
  rotateLeft: "向左旋转",
  rotateRight: "向右旋转",
  zoomLabel: "缩放",
  rotationLabel: "旋转",
  previewAlt: "头像预览",
  helper: "拖动、缩放或旋转，圈内即为最终显示区域。",
});

let getContextSpy;
let toBlobSpy;

beforeEach(() => {
  getContextSpy = jest
    .spyOn(window.HTMLCanvasElement.prototype, "getContext")
    .mockImplementation(() => ({
      save: jest.fn(),
      restore: jest.fn(),
      clearRect: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      drawImage: jest.fn(),
    }));
  toBlobSpy = jest
    .spyOn(window.HTMLCanvasElement.prototype, "toBlob")
    .mockImplementation(function mockToBlob(callback) {
      callback(new Blob(["avatar"], { type: "image/png" }));
    });
});

afterEach(() => {
  getContextSpy?.mockRestore();
  toBlobSpy?.mockRestore();
});

/**
 * 测试目标：确认按钮应导出裁剪结果并调用上层回调。
 * 前置条件：模态已打开、图片加载完成。
 * 步骤：
 *  1) 渲染 AvatarCropperModal 并触发图片 load 事件；
 *  2) 点击确认按钮；
 * 断言：
 *  - onConfirm 收到 File 实例；
 *  - 文件名包含 -cropped；
 *  - toBlob 被调用生成位图。
 * 边界/异常：
 *  - 若 canvas 环境缺失，则需在组件中优雅降级（另行覆盖）。
 */
test("GivenLoadedImage_WhenConfirm_ThenEmitCroppedFile", async () => {
  const onCancel = jest.fn();
  const onConfirm = jest.fn().mockResolvedValue();
  render(
    <AvatarCropperModal
      open
      source="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA"
      fileName="profile"
      copy={buildCopy()}
      onCancel={onCancel}
      onConfirm={onConfirm}
      processing={false}
    />,
  );

  const image = screen.getByRole("img", { name: "头像预览" });
  Object.defineProperty(image, "naturalWidth", { value: 640, configurable: true });
  Object.defineProperty(image, "naturalHeight", { value: 640, configurable: true });
  fireEvent.load(image);

  await userEvent.click(screen.getByRole("button", { name: "确认" }));

  await waitFor(() => {
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  const [receivedFile] = onConfirm.mock.calls[0];
  expect(receivedFile).toBeInstanceOf(File);
  expect(receivedFile.name).toContain("-cropped");
  expect(toBlobSpy).toHaveBeenCalled();
});

/**
 * 测试目标：缩放按钮应更新滑块值并保持遮罩渲染。
 * 前置条件：模态打开且图片已加载。
 * 步骤：
 *  1) 点击放大按钮；
 *  2) 再点击缩小按钮；
 *  3) 读取滑块 value 与遮罩节点。
 * 断言：
 *  - 滑块值在放大后增加、缩小后回落；
 *  - 遮罩元素存在。
 * 边界/异常：
 *  - 若未来放宽缩放范围，需同步更新断言计算。
 */
test("GivenZoomControls_WhenInteracted_ThenAdjustSliderAndKeepOverlay", async () => {
  render(
    <AvatarCropperModal
      open
      source="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA"
      fileName="user"
      copy={buildCopy()}
      onCancel={jest.fn()}
      onConfirm={jest.fn()}
      processing={false}
    />,
  );

  const image = screen.getByRole("img", { name: "头像预览" });
  Object.defineProperty(image, "naturalWidth", { value: 800, configurable: true });
  Object.defineProperty(image, "naturalHeight", { value: 600, configurable: true });
  fireEvent.load(image);

  const slider = screen.getByRole("slider", { name: "缩放" });
  expect(parseFloat(slider.value)).toBeCloseTo(1); // 初始值

  await userEvent.click(screen.getByRole("button", { name: "放大" }));
  expect(parseFloat(slider.value)).toBeGreaterThan(1);

  await userEvent.click(screen.getByRole("button", { name: "缩小" }));
  expect(parseFloat(slider.value)).toBeCloseTo(1, 5);

  expect(screen.getByTestId("avatar-cropper-overlay")).toBeInTheDocument();
});
