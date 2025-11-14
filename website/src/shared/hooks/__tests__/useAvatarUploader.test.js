import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";

const mockUseApi = jest.fn();
const mockUseUser = jest.fn();
const mockCacheBust = jest.fn();

jest.unstable_mockModule("@shared/hooks/useApi.js", () => ({
  useApi: mockUseApi,
}));

jest.unstable_mockModule("@core/context", () => ({
  useUser: mockUseUser,
}));

jest.unstable_mockModule("@shared/utils", () => ({
  cacheBust: mockCacheBust,
}));

let useAvatarUploader;
let AVATAR_UPLOAD_STATUS;

const DEFAULT_AVATAR_URL = "https://cdn.example.com/avatar.png";
const AVATAR_FILE = { name: "avatar.png" };

const createBaseUser = (overrides = {}) => ({
  id: "42",
  token: "token-123",
  username: "Taylor",
  avatar: "https://cdn.example.com/avatar-old.png",
  ...overrides,
});

const buildUploadAvatarMock = (avatar = DEFAULT_AVATAR_URL) =>
  jest.fn().mockResolvedValue({ avatar });

const setupHook = ({
  user = createBaseUser(),
  setUser = jest.fn(),
  uploadAvatar = jest.fn(),
  hookOptions,
} = {}) => {
  mockUseApi.mockReturnValue({ users: { uploadAvatar } });
  mockUseUser.mockReturnValue({ user, setUser });

  const rendered = renderHook(() => useAvatarUploader(hookOptions));
  return { ...rendered, user, setUser, uploadAvatar };
};

const selectAvatar = async (result, files = [AVATAR_FILE]) => {
  let didUpload = false;

  await act(async () => {
    didUpload = await result.current.onSelectAvatar(files);
  });

  return didUpload;
};

const expectResultState = (result, status, error = null) => {
  expect(result.current.status).toBe(status);
  expect(result.current.error).toBe(error);
};

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
    mockCacheBust.mockImplementation((url) => `${url}?cache`);
  });

  describe("success scenarios", () => {
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
      const baseUser = createBaseUser();
      const uploadAvatarMock = buildUploadAvatarMock();
      const setUser = jest.fn();
      const { result } = setupHook({
        user: baseUser,
        setUser,
        uploadAvatar: uploadAvatarMock,
      });

      const didUpload = await selectAvatar(result);

      expect(didUpload).toBe(true);
      expect(uploadAvatarMock).toHaveBeenCalledWith({
        userId: baseUser.id,
        token: baseUser.token,
        file: AVATAR_FILE,
      });
      expect(mockCacheBust).toHaveBeenCalledWith(DEFAULT_AVATAR_URL);
      expect(setUser).toHaveBeenCalledWith({
        ...baseUser,
        avatar: `${DEFAULT_AVATAR_URL}?cache`,
      });
      expectResultState(result, AVATAR_UPLOAD_STATUS.succeeded);
    });
  });

  describe("validation scenarios", () => {
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
      const { result, setUser } = setupHook({ uploadAvatar: uploadAvatarMock });

      const didUpload = await selectAvatar(result, []);

      expect(didUpload).toBe(false);
      expect(uploadAvatarMock).not.toHaveBeenCalled();
      expect(setUser).not.toHaveBeenCalled();
      expectResultState(result, AVATAR_UPLOAD_STATUS.idle);
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
      const { result } = setupHook({
        user: null,
        setUser: jest.fn(),
        uploadAvatar: uploadAvatarMock,
      });

      const didUpload = await selectAvatar(result);

      expect(didUpload).toBe(false);
      expect(uploadAvatarMock).not.toHaveBeenCalled();
      expect(result.current.status).toBe(AVATAR_UPLOAD_STATUS.failed);
      expect(result.current.error?.code).toBe("avatar-upload-missing-user");
    });
  });

  describe("error scenarios", () => {
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
      const onError = jest.fn();
      const { result, setUser } = setupHook({
        uploadAvatar: uploadAvatarMock,
        hookOptions: { onError },
      });

      const didUpload = await selectAvatar(result);

      expect(didUpload).toBe(false);
      expect(onError).toHaveBeenCalledWith(uploadError);
      expectResultState(result, AVATAR_UPLOAD_STATUS.failed, uploadError);
      expect(setUser).not.toHaveBeenCalled();
    });
  });
});
