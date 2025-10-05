import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";

const mockUseApi = jest.fn();
const mockUseUser = jest.fn();
const mockCacheBust = jest.fn();
const mockNormalizeFiles = jest.fn();

jest.unstable_mockModule("@/hooks/useApi.js", () => ({
  useApi: mockUseApi,
}));

jest.unstable_mockModule("@/context", () => ({
  useUser: mockUseUser,
}));

jest.unstable_mockModule("@/utils", () => ({
  cacheBust: mockCacheBust,
  normalizeFiles: mockNormalizeFiles,
}));

let useAvatarUploader;
let AVATAR_UPLOAD_STATUS;

describe("useAvatarUploader", () => {
  beforeAll(async () => {
    ({ default: useAvatarUploader, AVATAR_UPLOAD_STATUS } = await import(
      "../useAvatarUploader.js"
    ));
  });

  beforeEach(() => {
    mockUseApi.mockReset();
    mockUseUser.mockReset();
    mockCacheBust.mockReset();
    mockNormalizeFiles.mockReset();
    mockCacheBust.mockImplementation((url) => `${url}?cache`);
    mockNormalizeFiles.mockImplementation((files) => {
      if (!files) {
        return [];
      }
      if (Array.isArray(files)) {
        return files.filter(Boolean);
      }
      return [files].filter(Boolean);
    });
  });

  /**
   * 测试目标：提供有效文件与用户上下文时应调用上传接口并刷新用户头像。
   * 前置条件：users.uploadAvatar 返回包含 avatar 字段的响应。
   * 步骤：
   *  1) 渲染 Hook 并执行 onSelectAvatar 命令；
   *  2) 等待 Promise 解析完成。
   * 断言：
   *  - uploadAvatar 接收到正确的 userId/token/file 参数；
   *  - setUser 得到带缓存穿透参数的头像地址；
   * 边界/异常：
   *  - 若响应缺少 avatar 字段，setUser 不应被调用（另行覆盖）。
   */
  test("GivenValidFileAndUser_WhenSelectAvatar_ThenUploadsAndUpdatesUser", async () => {
    const uploadAvatarMock = jest
      .fn()
      .mockResolvedValue({ avatar: "https://cdn.example.com/avatar.png" });
    const baseUser = {
      id: "42",
      token: "token-123",
      username: "Taylor",
      avatar: "https://cdn.example.com/avatar-old.png",
    };
    const setUser = jest.fn();

    mockUseApi.mockReturnValue({ users: { uploadAvatar: uploadAvatarMock } });
    mockUseUser.mockReturnValue({ user: baseUser, setUser });

    const { result } = renderHook(() => useAvatarUploader());

    await act(async () => {
      const didUpload = await result.current.onSelectAvatar([
        { name: "avatar.png" },
      ]);
      expect(didUpload).toBe(true);
    });

    expect(uploadAvatarMock).toHaveBeenCalledWith({
      userId: "42",
      token: "token-123",
      file: { name: "avatar.png" },
    });
    expect(mockCacheBust).toHaveBeenCalledWith(
      "https://cdn.example.com/avatar.png",
    );
    expect(setUser).toHaveBeenCalledWith({
      ...baseUser,
      avatar: "https://cdn.example.com/avatar.png?cache",
    });
    expect(result.current.status).toBe(AVATAR_UPLOAD_STATUS.succeeded);
    expect(result.current.error).toBeNull();
  });

  /**
   * 测试目标：当未选择任何文件时不应触发上传流程。
   * 前置条件：用户上下文可用但文件列表为空。
   * 步骤：
   *  1) 渲染 Hook；
   *  2) 传入空数组执行 onSelectAvatar。
   * 断言：
   *  - uploadAvatar 与 setUser 均未被调用；
   *  - 状态保持 idle。
   * 边界/异常：
   *  - 覆盖 files 为 null 或 undefined 的场景。
   */
  test("GivenNoFile_WhenSelectAvatar_ThenSkipUpload", async () => {
    const uploadAvatarMock = jest.fn();
    const setUser = jest.fn();

    mockUseApi.mockReturnValue({ users: { uploadAvatar: uploadAvatarMock } });
    mockUseUser.mockReturnValue({
      user: { id: "42", token: "token-123" },
      setUser,
    });

    const { result } = renderHook(() => useAvatarUploader());

    await act(async () => {
      const didUpload = await result.current.onSelectAvatar([]);
      expect(didUpload).toBe(false);
    });

    expect(uploadAvatarMock).not.toHaveBeenCalled();
    expect(setUser).not.toHaveBeenCalled();
    expect(result.current.status).toBe(AVATAR_UPLOAD_STATUS.idle);
    expect(result.current.error).toBeNull();
  });

  /**
   * 测试目标：缺失用户上下文时应返回错误并记录语义化错误码。
   * 前置条件：useUser 返回 null 用户。
   * 步骤：
   *  1) 渲染 Hook；
   *  2) 传入文件执行 onSelectAvatar。
   * 断言：
   *  - uploadAvatar 未被调用；
   *  - 状态为 failed 且 error.code 为 avatar-upload-missing-user。
   * 边界/异常：
   *  - 若未来支持游客上传，应调整此分支逻辑。
   */
  test("GivenMissingUser_WhenSelectAvatar_ThenFailWithSemanticError", async () => {
    const uploadAvatarMock = jest.fn();

    mockUseApi.mockReturnValue({ users: { uploadAvatar: uploadAvatarMock } });
    mockUseUser.mockReturnValue({ user: null, setUser: jest.fn() });

    const { result } = renderHook(() => useAvatarUploader());

    await act(async () => {
      const didUpload = await result.current.onSelectAvatar([
        { name: "avatar.png" },
      ]);
      expect(didUpload).toBe(false);
    });

    expect(uploadAvatarMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe(AVATAR_UPLOAD_STATUS.failed);
    expect(result.current.error?.code).toBe("avatar-upload-missing-user");
  });

  /**
   * 测试目标：上传接口异常时应回调 onError 并保留错误对象。
   * 前置条件：uploadAvatar 抛出错误；提供 onError 回调。
   * 步骤：
   *  1) 渲染 Hook，传入 onError；
   *  2) 触发上传并捕获异常分支。
   * 断言：
   *  - onError 收到抛出的错误实例；
   *  - 状态为 failed 且 setUser 未被调用。
   * 边界/异常：
   *  - 可在未来扩展重试机制时复用该断言。
   */
  test("GivenUploadError_WhenSelectAvatar_ThenPropagateFailure", async () => {
    const uploadError = new Error("network-broken");
    const uploadAvatarMock = jest.fn().mockRejectedValue(uploadError);
    const setUser = jest.fn();
    const onError = jest.fn();

    mockUseApi.mockReturnValue({ users: { uploadAvatar: uploadAvatarMock } });
    mockUseUser.mockReturnValue({
      user: { id: "42", token: "token-123" },
      setUser,
    });

    const { result } = renderHook(() => useAvatarUploader({ onError }));

    await act(async () => {
      const didUpload = await result.current.onSelectAvatar([
        { name: "avatar.png" },
      ]);
      expect(didUpload).toBe(false);
    });

    expect(onError).toHaveBeenCalledWith(uploadError);
    expect(result.current.status).toBe(AVATAR_UPLOAD_STATUS.failed);
    expect(result.current.error).toBe(uploadError);
    expect(setUser).not.toHaveBeenCalled();
  });
});
