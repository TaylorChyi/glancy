/* eslint-env jest */
import React, { useEffect } from "react";
import { render, act, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const modalSpy = jest.fn();
const avatarUploaderHookMock = jest.fn();

jest.unstable_mockModule("@/components/modals/AvatarCropperModal.jsx", () => ({
  __esModule: true,
  default: (props) => {
    modalSpy(props);
    return null;
  },
}));

jest.unstable_mockModule("../useAvatarUploader.js", () => ({
  __esModule: true,
  default: (...args) => avatarUploaderHookMock(...args),
}));

const { default: useAvatarChangeFlow } = await import("../useAvatarChangeFlow.js");

function HookHarness({ captureRef }) {
  const flow = useAvatarChangeFlow({
    copy: {
      title: "调整头像",
      cancel: "取消",
      confirm: "确认",
      zoomIn: "放大",
      zoomOut: "缩小",
      rotateLeft: "逆时针",
      rotateRight: "顺时针",
      zoomLabel: "缩放",
      rotationLabel: "旋转",
      previewAlt: "头像预览",
    },
  });

  useEffect(() => {
    captureRef.current = flow;
  }, [captureRef, flow]);

  return <>{flow.overlays}</>;
}

let originalCreateObjectUrl;
let originalRevokeObjectUrl;
let mockUploaderInstance;

beforeAll(() => {
  originalCreateObjectUrl = global.URL?.createObjectURL;
  originalRevokeObjectUrl = global.URL?.revokeObjectURL;
});

beforeEach(() => {
  modalSpy.mockClear();
  avatarUploaderHookMock.mockClear();
  mockUploaderInstance = {
    onSelectAvatar: jest.fn(),
    isUploading: false,
    status: "idle",
    error: null,
    reset: jest.fn(),
  };
  avatarUploaderHookMock.mockReturnValue(mockUploaderInstance);
  global.URL.createObjectURL = jest.fn(() => "blob:mock-avatar");
  global.URL.revokeObjectURL = jest.fn();
});

afterAll(() => {
  global.URL.createObjectURL = originalCreateObjectUrl;
  global.URL.revokeObjectURL = originalRevokeObjectUrl;
});

/**
 * 测试目标：成功裁剪后触发上传并清理对象 URL。
 * 前置条件：挂载 HookHarness 并模拟选择图片文件。
 * 步骤：
 *  1) 调用 identity.onSelectAvatar 传入文件数组；
 *  2) 触发裁剪模态的 onConfirm 回调；
 *  3) 等待状态回落至 idle。
 * 断言：
 *  - createObjectURL 被调用；
 *  - uploader.onSelectAvatar 收到裁剪后的文件；
 *  - revokeObjectURL 在关闭时被调用且 overlays 为空。
 * 边界/异常：
 *  - 若上传失败则需留在编辑态（由后续测试覆盖）。
 */
test("GivenFileSelection_WhenConfirmSucceeded_ThenUploadAndCleanup", async () => {
  mockUploaderInstance.onSelectAvatar.mockResolvedValueOnce(true);
  const captureRef = { current: null };
  render(<HookHarness captureRef={captureRef} />);

  await waitFor(() => {
    expect(captureRef.current).not.toBeNull();
  });

  const file = new File(["avatar"], "face.png", { type: "image/png" });

  await act(async () => {
    const handled = captureRef.current.identity.onSelectAvatar([file]);
    expect(handled).toBe(true);
  });

  expect(global.URL.createObjectURL).toHaveBeenCalled();

  await waitFor(() => {
    expect(modalSpy).toHaveBeenCalled();
  });

  const latestProps = modalSpy.mock.calls[modalSpy.mock.calls.length - 1][0];
  expect(latestProps.open).toBe(true);

  const croppedFile = new File(["cropped"], "face-cropped.png", { type: "image/png" });

  await act(async () => {
    await latestProps.onConfirm(croppedFile);
  });

  expect(mockUploaderInstance.onSelectAvatar).toHaveBeenCalledWith([croppedFile]);

  await waitFor(() => {
    expect(captureRef.current.overlays).toHaveLength(0);
  });

  expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-avatar");
});

/**
 * 测试目标：上传失败时保持编辑态并重新渲染模态。
 * 前置条件：模拟 uploader 返回 false。
 * 步骤：
 *  1) 触发文件选择；
 *  2) 调用 onConfirm 并等待 Promise 解析；
 * 断言：
 *  - uploader.onSelectAvatar 被调用一次；
 *  - overlays 仍包含模态节点；
 *  - revokeObjectURL 尚未触发。
 * 边界/异常：
 *  - 若未来加入失败提示，应在此更新断言关注提示内容。
 */
test("GivenUploadFailure_WhenConfirm_ThenRemainInEditingPhase", async () => {
  mockUploaderInstance.onSelectAvatar.mockResolvedValueOnce(false);
  const captureRef = { current: null };
  render(<HookHarness captureRef={captureRef} />);

  await waitFor(() => {
    expect(captureRef.current).not.toBeNull();
  });

  const file = new File(["avatar"], "face.png", { type: "image/png" });

  await act(async () => {
    captureRef.current.identity.onSelectAvatar([file]);
  });

  const latestProps = modalSpy.mock.calls[modalSpy.mock.calls.length - 1][0];
  await act(async () => {
    await latestProps.onConfirm(new File(["crop"], "face-cropped.png", { type: "image/png" }));
  });

  expect(mockUploaderInstance.onSelectAvatar).toHaveBeenCalledTimes(1);
  expect(captureRef.current.overlays).toHaveLength(1);
  expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
});
