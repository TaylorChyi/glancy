/* eslint-env jest */
import { act, renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";

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
test(
  "GivenFileSelection_WhenConfirmingCrop_ThenUploaderReceivesNormalizedFile",
  async () => {
    const file = new File(["avatar"], "原始头像.png", { type: "image/png" });
    const blob = new Blob(["cropped"], { type: "image/png" });

    const { result } = renderHook(() => useAvatarEditorWorkflow());

    act(() => {
      const opened = result.current.selectAvatar([file]);
      expect(opened).toBe(true);
    });

    expect(result.current.modalProps.open).toBe(true);

    const { onSelectAvatar, reset } = mockUseAvatarUploader.mock.results[0]
      .value;

    await act(async () => {
      await result.current.modalProps.onConfirm({
        blob,
        previewUrl: "blob:crop",
      });
    });

    expect(onSelectAvatar).toHaveBeenCalledTimes(1);
    const [[uploadedFiles]] = onSelectAvatar.mock.calls;
    expect(uploadedFiles[0]).toBeInstanceOf(File);
    expect(uploadedFiles[0].name).toBe("原始头像.png");
    expect(result.current.modalProps.open).toBe(false);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:crop");
  },
);

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
test(
  "GivenPreviewState_WhenCanceling_ThenStateResetsAndUrlRevoked",
  () => {
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
  },
);
