import { jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useResponseStylePreferences } from "../useResponseStylePreferences.js";

const createUser = (token = "token-123") => ({ token });

const createProfileResponse = (overrides = {}) => ({
  job: "Engineer",
  education: "Master",
  interest: "Reading",
  goal: "Grow",
  currentAbility: "Intermediate",
  responseStyle: "friendly",
  customSections: [],
  ...overrides,
});

/**
 * 测试目标：
 *  - 验证钩子在挂载后会按用户 token 拉取档案并同步到本地状态。
 * 前置条件：
 *  - 存在具备 token 的用户对象，fetchProfile 能成功解析服务端响应。
 * 步骤：
 *  1) 渲染 Hook 并等待请求结束。
 *  2) 观察 state 是否进入 ready 状态并填充响应风格。
 * 断言：
 *  - fetchProfile 被携带 token 调用一次；state.values 与 persisted 含预期字段。
 * 边界/异常：
 *  - 若请求失败则该断言会超时，提示初始化路径异常。
 */
test(
  "Given_authenticatedUser_When_hookMounts_Then_hydratesProfileDetails",
  async () => {
    const profileResponse = createProfileResponse();
    const fetchProfile = jest.fn().mockResolvedValue(profileResponse);
    const saveProfile = jest.fn();
    const user = createUser();

    const { result } = renderHook(() =>
      useResponseStylePreferences({ user, fetchProfile, saveProfile }),
    );

    await waitFor(() => {
      expect(fetchProfile).toHaveBeenCalledWith({ token: user.token });
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe("ready");
      expect(result.current.state.values.responseStyle).toBe("friendly");
      expect(result.current.state.persisted.responseStyle).toBe("friendly");
    });
  },
);

/**
 * 测试目标：
 *  - 校验在首轮加载失败后调用 handleRetry 会重新触发远程获取并恢复正常状态。
 * 前置条件：
 *  - fetchProfile 首次抛出异常，第二次返回合法响应；用户保持登录态。
 * 步骤：
 *  1) 渲染 Hook 并等待首次失败完成。
 *  2) 调用 handleRetry，等待下一次请求成功。
 * 断言：
 *  - fetchProfile 总共被调用两次，最终 state.status 变为 ready。
 * 边界/异常：
 *  - 若 handleRetry 未触发请求或状态未恢复，将抛出断言失败以提示回归。
 */
test(
  "Given_retryableFailure_When_handleRetryInvoked_Then_recoversPreferences",
  async () => {
    const profileResponse = createProfileResponse({ responseStyle: "concise" });
    const fetchProfile = jest
      .fn()
      .mockRejectedValueOnce(new Error("network-error"))
      .mockResolvedValueOnce(profileResponse);
    const saveProfile = jest.fn();
    const user = createUser();

    const { result } = renderHook(() =>
      useResponseStylePreferences({ user, fetchProfile, saveProfile }),
    );

    await waitFor(() => {
      expect(fetchProfile).toHaveBeenCalledTimes(1);
      expect(result.current.state.status).toBe("error");
    });

    await act(async () => {
      result.current.handleRetry();
    });

    await waitFor(() => {
      expect(fetchProfile).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe("ready");
      expect(result.current.state.values.responseStyle).toBe("concise");
    });
  },
);
