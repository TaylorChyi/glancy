/* eslint-env jest */
import { act, renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";
import { normalizeAvatarFileName } from "@shared/utils/avatarFile.js";

const mockUseAvatarUploader = jest.fn();

jest.unstable_mockModule("../useAvatarUploader.js", () => ({
  __esModule: true,
  default: mockUseAvatarUploader,
}));

let useAvatarEditorWorkflow;

beforeAll(async () => {
  ({ default: useAvatarEditorWorkflow } = await import(
    "../useAvatarEditorWorkflow.js"
  ));
});

beforeEach(() => {
  mockUseAvatarUploader.mockReset();
  mockUseAvatarUploader.mockReturnValue({
    onSelectAvatar: jest.fn().mockResolvedValue(true),
    isUploading: false,
    reset: jest.fn(),
  });
  global.URL.createObjectURL = jest.fn(() => "blob:preview");
  global.URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * 测试目标：
 *  - 选择文件后应进入预览态，并在确认时生成标准化文件提交给上传命令。
 * 前置条件：
 *  - useAvatarUploader mock 返回成功 Promise；
 *  - 浏览器 URL API 已被 stub。
 * 步骤：
 *  1) 调用 selectAvatar 传入文件；
 *  2) 调用 modalProps.onConfirm 传入裁剪结果；
 * 断言：
 *  - onSelectAvatar 收到 File 对象；
 *  - modalProps.open 在上传成功后关闭；
 *  - reset 被调用以复位状态。
 * 边界/异常：
 *  - 涵盖 previewUrl 回收逻辑。
 */
test("GivenFileSelection_WhenConfirmingCrop_ThenUploaderReceivesNormalizedFile", async () => {
  const file = new File(["avatar"], "原始头像.png", { type: "image/png" });
  const blob = new Blob(["cropped"], { type: "image/png" });

  const { result } = renderHook(() => useAvatarEditorWorkflow());

  act(() => {
    const opened = result.current.selectAvatar([file]);
    expect(opened).toBe(true);
  });

  expect(result.current.modalProps.open).toBe(true);

  const { onSelectAvatar, reset } = mockUseAvatarUploader.mock.results[0].value;

  await act(async () => {
    await result.current.modalProps.onConfirm({
      blob,
      previewUrl: "blob:crop",
    });
  });

  expect(onSelectAvatar).toHaveBeenCalledTimes(1);
  const [[uploadedFiles]] = onSelectAvatar.mock.calls;
  expect(uploadedFiles[0]).toBeInstanceOf(File);
  expect(uploadedFiles[0].name).toBe(
    normalizeAvatarFileName(file.name, blob.type),
  );
  expect(result.current.modalProps.open).toBe(false);
  expect(reset).toHaveBeenCalledTimes(1);
  expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:crop");
});

/**
 * 测试目标：
 *  - 用户在预览态点击取消时应回收 URL 并重置状态机。
 * 前置条件：
 *  - selectAvatar 已成功打开预览；
 *  - useAvatarUploader.reset 已被 mock。
 * 步骤：
 *  1) 打开预览态；
 *  2) 调用 modalProps.onCancel。
 * 断言：
 *  - modalProps.open 返回 false；
 *  - reset 调用一次；
 *  - createObjectURL 与 revokeObjectURL 均被触发。
 * 边界/异常：
 *  - 确保未选择文件时 onCancel 亦可安全调用（隐式覆盖）。
 */
test("GivenPreviewState_WhenCanceling_ThenStateResetsAndUrlRevoked", () => {
  const file = new File(["avatar"], "avatar.webp", { type: "image/webp" });
  const { result } = renderHook(() => useAvatarEditorWorkflow());

  act(() => {
    result.current.selectAvatar([file]);
  });

  expect(result.current.modalProps.open).toBe(true);

  const { reset } = mockUseAvatarUploader.mock.results[0].value;

  act(() => {
    result.current.modalProps.onCancel();
  });

  expect(reset).toHaveBeenCalledTimes(1);
  expect(result.current.modalProps.open).toBe(false);
  expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
});

/**
 * 测试目标：
 *  - 上传命令返回失败时保持预览态且不调用 reset。
 * 前置条件：
 *  - onSelectAvatar mock 返回 false。
 * 步骤：
 *  1) 打开预览态；
 *  2) 触发 onConfirm 并返回失败。
 * 断言：
 *  - modalProps.open 仍为 true；
 *  - reset 未被调用。
 */
test("GivenUploaderFailure_WhenConfirming_ThenStayInPreviewState", async () => {
  const failSpy = jest.fn().mockResolvedValue(false);
  mockUseAvatarUploader.mockReturnValue({
    onSelectAvatar: failSpy,
    isUploading: false,
    reset: jest.fn(),
  });

  const file = new File(["avatar"], "avatar.webp", { type: "image/webp" });
  const blob = new Blob(["cropped"], { type: "image/png" });
  const { result } = renderHook(() => useAvatarEditorWorkflow());

  act(() => {
    result.current.selectAvatar([file]);
  });

  const { reset } = mockUseAvatarUploader.mock.results[0].value;

  await act(async () => {
    const completed = await result.current.modalProps.onConfirm({
      blob,
      previewUrl: "blob:failed",
    });
    expect(completed).toBe(false);
  });

  expect(reset).not.toHaveBeenCalled();
  expect(result.current.modalProps.open).toBe(true);
  expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:failed");
});

/**
 * 测试目标：
 *  - 裁剪回调缺失 blob 时跳过上传并回收 previewUrl。
 * 前置条件：
 *  - selectAvatar 已生成预览态；
 *  - onSelectAvatar mock 为 jest.fn。
 * 步骤：
 *  1) 调用 onConfirm 且不传 blob；
 * 断言：
 *  - onSelectAvatar 未被调用；
 *  - revokeObjectURL 被调用。
 */
test("GivenMissingBlob_WhenConfirming_ThenSkipUploaderAndRevokePreview", async () => {
  const file = new File(["avatar"], "avatar.webp", { type: "image/webp" });
  const { result } = renderHook(() => useAvatarEditorWorkflow());

  act(() => {
    result.current.selectAvatar([file]);
  });

  const { onSelectAvatar } = mockUseAvatarUploader.mock.results[0].value;

  await act(async () => {
    const completed = await result.current.modalProps.onConfirm({
      blob: null,
      previewUrl: "blob:missing",
    });
    expect(completed).toBe(false);
  });

  expect(onSelectAvatar).not.toHaveBeenCalled();
  expect(result.current.modalProps.open).toBe(true);
  expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:missing");
});
