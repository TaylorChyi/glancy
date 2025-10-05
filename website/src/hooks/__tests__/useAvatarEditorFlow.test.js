import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";

const mockUseAvatarUploader = jest.fn();
const mockNormalizeFiles = jest.fn();
const mockNormalizeImageOrientation = jest.fn();

jest.unstable_mockModule("@/hooks/useAvatarUploader.js", () => ({
  __esModule: true,
  default: mockUseAvatarUploader,
  AVATAR_UPLOAD_STATUS: {
    idle: "idle",
    uploading: "uploading",
    succeeded: "succeeded",
    failed: "failed",
  },
}));

jest.unstable_mockModule("@/utils", () => ({
  normalizeFiles: mockNormalizeFiles,
  normalizeImageOrientation: mockNormalizeImageOrientation,
}));

let useAvatarEditorFlow;

const createMockUploader = () => ({
  onSelectAvatar: jest.fn().mockResolvedValue(true),
  status: "idle",
  isUploading: false,
  error: null,
  reset: jest.fn(),
});

describe("useAvatarEditorFlow", () => {
  let originalCreateObjectURL;
  let originalRevokeObjectURL;

  beforeAll(async () => {
    ({ default: useAvatarEditorFlow } = await import("../useAvatarEditorFlow.js"));
  });

  beforeEach(() => {
    mockUseAvatarUploader.mockReset();
    mockNormalizeFiles.mockReset();
    mockNormalizeImageOrientation.mockReset();

    mockNormalizeFiles.mockImplementation((files) =>
      Array.isArray(files) ? files.filter(Boolean) : [files].filter(Boolean),
    );

    const previewUrl = "blob:preview";
    const revoke = jest.fn();
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn().mockReturnValue(previewUrl);
    URL.revokeObjectURL = revoke;

    mockUseAvatarUploader.mockReturnValue(createMockUploader());
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  /**
   * 测试目标：成功选择图片并确认时应生成裁剪文件并调用上传逻辑。
   * 前置条件：normalizeImageOrientation 返回 400x400 的 Blob，上传函数返回 true。
   * 步骤：
   *  1) 选择文件触发裁剪弹窗；
   *  2) 调用 handleConfirm；
   *  3) 等待 Promise 完成。
   * 断言：
   *  - avatarEditor 打开且拥有预览地址；
   *  - 上传函数收到 File 实例；
   *  - reset 被调用并回到 idle 状态。
   * 边界/异常：
   *  - 若 URL API 不可用应提前退出（由 Hook 内部处理）。
   */
  test("GivenValidImage_WhenConfirm_ThenUploadsCroppedFile", async () => {
    const uploader = createMockUploader();
    mockUseAvatarUploader.mockReturnValue(uploader);

    const previewBlob = new Blob(["preview"], { type: "image/png" });
    mockNormalizeImageOrientation.mockResolvedValue({
      blob: previewBlob,
      width: 400,
      height: 400,
    });

    const { result } = renderHook(() => useAvatarEditorFlow());

    await act(async () => {
      const didSelect = await result.current.onSelectAvatar([
        new File(["source"], "avatar.png", { type: "image/png" }),
      ]);
      expect(didSelect).toBe(true);
    });

    expect(result.current.avatarEditor.open).toBe(true);
    expect(result.current.avatarEditor.imageUrl).toBe("blob:preview");
    expect(result.current.avatarEditor.imageWidth).toBe(400);

    const croppedBlob = new Blob(["cropped"], { type: "image/png" });

    await act(async () => {
      const didConfirm = await result.current.avatarEditor.handleConfirm(croppedBlob);
      expect(didConfirm).toBe(true);
    });

    expect(uploader.onSelectAvatar).toHaveBeenCalledTimes(1);
    const [[filesArg]] = uploader.onSelectAvatar.mock.calls;
    expect(Array.isArray(filesArg)).toBe(true);
    const [uploadedFile] = filesArg;
    expect(uploadedFile).toBeInstanceOf(File);
    expect(uploadedFile.name).toBe("avatar.png");
    expect(uploader.reset).toHaveBeenCalled();
    expect(result.current.avatarEditor.open).toBe(false);
  });

  /**
   * 测试目标：取消裁剪时应撤销预览并重置状态机。
   * 前置条件：已成功选择图片。
   * 步骤：
   *  1) 选择文件触发裁剪；
   *  2) 调用 handleCancel。
   * 断言：
   *  - avatarEditor.open 为 false；
   *  - uploader.reset 被调用。
   * 边界/异常：
   *  - 确保重复选择不会残留旧的 objectURL。
   */
  test("GivenActiveEditor_WhenCancel_ThenResetsState", async () => {
    const uploader = createMockUploader();
    mockUseAvatarUploader.mockReturnValue(uploader);
    mockNormalizeImageOrientation.mockResolvedValue({
      blob: new Blob(["preview"], { type: "image/png" }),
      width: 256,
      height: 256,
    });

    const { result } = renderHook(() => useAvatarEditorFlow());

    await act(async () => {
      await result.current.onSelectAvatar([
        new File(["source"], "me.jpg", { type: "image/jpeg" }),
      ]);
    });

    expect(result.current.avatarEditor.open).toBe(true);

    act(() => {
      result.current.avatarEditor.handleCancel();
    });

    expect(result.current.avatarEditor.open).toBe(false);
    expect(uploader.reset).toHaveBeenCalled();
  });

  /**
   * 测试目标：当图片归一化失败时应标记失败状态并暴露错误。
   * 前置条件：normalizeImageOrientation 抛出错误。
   * 步骤：
   *  1) 调用 onSelectAvatar；
   *  2) 捕获返回值。
   * 断言：
   *  - 函数返回 false；
   *  - avatarEditor.status 为 failed 且 error 存在。
   * 边界/异常：
   *  - 错误对象需透传给上层以便进一步提示。
   */
  test("GivenNormalizationFailure_WhenSelectAvatar_ThenExposeError", async () => {
    const failure = new Error("orientation-failed");
    mockNormalizeImageOrientation.mockRejectedValue(failure);

    const { result } = renderHook(() => useAvatarEditorFlow());

    await act(async () => {
      const didSelect = await result.current.onSelectAvatar([
        new File(["source"], "broken.png", { type: "image/png" }),
      ]);
      expect(didSelect).toBe(false);
    });

    expect(result.current.avatarEditor.status).toBe("failed");
    expect(result.current.avatarEditor.error).toBe(failure);
  });
});
