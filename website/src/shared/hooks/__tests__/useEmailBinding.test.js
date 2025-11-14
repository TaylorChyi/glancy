import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import useEmailBinding from "@shared/hooks/useEmailBinding.js";

const baseUser = { id: 1, token: "token", email: "current@example.com" };

const createApiClient = (overrides = {}) => ({
  requestEmailChangeCode: jest.fn(),
  confirmEmailChange: jest.fn(),
  unbindEmail: jest.fn(),
  ...overrides,
});

const renderEmailBinding = ({
  user = baseUser,
  apiClient = createApiClient(),
  onUserUpdate = jest.fn(),
} = {}) => renderHook(() => useEmailBinding({ user, apiClient, onUserUpdate }));

/**
 * 验证 requestCode 会调用接口并写入倒计时相关状态。
 */
test("useEmailBinding requestCode requests verification code for new email", async () => {
  const apiClient = createApiClient({
    requestEmailChangeCode: jest.fn().mockResolvedValue(undefined),
  });

  const { result } = renderEmailBinding({ apiClient });

  await act(async () => {
    const response = await result.current.requestCode("fresh@example.com");
    expect(response).toBe(true);
  });

  expect(apiClient.requestEmailChangeCode).toHaveBeenCalledWith({
    userId: 1,
    email: "fresh@example.com",
    token: "token",
  });
  expect(result.current.codeIssuedAt).not.toBeNull();
  expect(result.current.lastRequestedEmail).toBe("fresh@example.com");
  expect(result.current.isAwaitingVerification).toBe(true);
});

/**
 * 测试目标：验证 requestCode 在邮箱未变化时直接抛错而不会触发接口调。
 * 前置条件：当前用户已绑定邮箱，API 客户端为 jest mock。
 * 步骤：
 *  1) 请求与当前邮箱大小写不同但语义一致的验证码；
 * 断言：
 *  - 抛出 email-binding-email-unchanged 错误；
 *  - requestEmailChangeCode 未被调用；
 * 边界/异常：邮箱大小写差异不应视为新邮箱。
 */
test("useEmailBinding requestCode rejects requesting code for unchanged email", async () => {
  const apiClient = createApiClient();

  const { result } = renderEmailBinding({ apiClient });

  await expect(
    act(() => result.current.requestCode("Current@Example.com")),
  ).rejects.toMatchObject({
    message: "email-binding-email-unchanged",
    code: "email-binding-email-unchanged",
  });

  expect(apiClient.requestEmailChangeCode).not.toHaveBeenCalled();
  expect(result.current.isAwaitingVerification).toBe(false);
});

/**
 * 验证 confirmChange 会在请求验证码后更新用户信息并复位内部状态。
 */
test("useEmailBinding confirmChange completes flow", async () => {
  const apiClient = createApiClient({
    confirmEmailChange: jest
      .fn()
      .mockResolvedValue({ email: "fresh@example.com" }),
  });
  const onUserUpdate = jest.fn();

  const { result } = renderEmailBinding({ apiClient, onUserUpdate });

  await act(async () => {
    await result.current.requestCode("fresh@example.com");
    const nextEmail = await result.current.confirmChange({
      email: "fresh@example.com",
      code: "123456",
    });
    expect(nextEmail).toBe("fresh@example.com");
  });

  expect(apiClient.confirmEmailChange).toHaveBeenCalledWith({
    userId: 1,
    email: "fresh@example.com",
    code: "123456",
    token: "token",
  });
  expect(onUserUpdate).toHaveBeenCalledWith({
    ...baseUser,
    email: "fresh@example.com",
  });
  expect(result.current.mode).toBe("idle");
  expect(result.current.codeIssuedAt).toBeNull();
});

/**
 * 验证 confirmChange 在未发送验证码时会抛出缺少验证码请求的错误。
 */
test(
  "useEmailBinding confirmChange rejects when invoked before requesting code",
  async () => {
    const apiClient = createApiClient();

    const { result } = renderEmailBinding({ apiClient });

    await expect(
      act(() =>
        result.current.confirmChange({
          email: "fresh@example.com",
          code: "123456",
        }),
      ),
    ).rejects.toThrow("email-binding-code-missing-request");
  },
);

/**
 * 验证 confirmChange 在验证码邮箱不匹配时会抛出邮箱不一致错误。
 */
test(
  "useEmailBinding confirmChange rejects when confirmation email differs",
  async () => {
    const apiClient = createApiClient({
      requestEmailChangeCode: jest.fn().mockResolvedValue(undefined),
    });

    const { result } = renderEmailBinding({ apiClient });

    await act(async () => {
      await result.current.requestCode("fresh@example.com");
    });

    await expect(
      act(() =>
        result.current.confirmChange({
          email: "else@example.com",
          code: "123456",
        }),
      ),
    ).rejects.toThrow("email-binding-email-mismatch");
  },
);

/**
 * 验证 unbindEmail 会清空绑定邮箱并触发回调。
 */
test("useEmailBinding unbindEmail clears bound email", async () => {
  const apiClient = createApiClient({
    unbindEmail: jest.fn().mockResolvedValue({ email: null }),
  });
  const onUserUpdate = jest.fn();

  const { result } = renderEmailBinding({ apiClient, onUserUpdate });

  await act(async () => {
    const updatedEmail = await result.current.unbindEmail();
    expect(updatedEmail).toBeNull();
  });

  expect(apiClient.unbindEmail).toHaveBeenCalledWith({
    userId: 1,
    token: "token",
  });
  expect(onUserUpdate).toHaveBeenCalledWith({
    ...baseUser,
    email: null,
  });
});

/**
 * 测试目标：解绑后重新请求验证码，应允许绑定新邮箱并重置校验状态。
 * 前置条件：初始用户已绑定邮箱，提供模拟 API 客户端。
 * 步骤：
 *  1) 调用 unbindEmail 并模拟父组件更新用户邮箱为空；
 *  2) 请求新邮箱验证码。
 * 断言：
 *  - requestEmailChangeCode 收到新邮箱；
 *  - Hook 进入等待验证码状态。
 * 边界/异常：
 *  - 覆盖解绑后的重新绑定路径。
 */
test(
  "useEmailBinding GivenUnboundEmail_WhenRequestingCode_ThenAllowRebindingFlow",
  async () => {
    const apiClient = createApiClient({
      requestEmailChangeCode: jest.fn().mockResolvedValue(undefined),
      unbindEmail: jest.fn().mockResolvedValue({ email: null }),
    });
    const onUserUpdate = jest.fn();

    const { result, rerender } = renderHook(
      ({ user }) => useEmailBinding({ user, apiClient, onUserUpdate }),
      { initialProps: { user: baseUser } },
    );

    await act(async () => {
      await result.current.unbindEmail();
    });

    expect(onUserUpdate).toHaveBeenCalledWith({ ...baseUser, email: null });

    rerender({ user: { ...baseUser, email: null } });

    await act(async () => {
      await result.current.requestCode("rebinding@example.com");
    });

    expect(apiClient.requestEmailChangeCode).toHaveBeenLastCalledWith({
      userId: 1,
      email: "rebinding@example.com",
      token: "token",
    });
    expect(result.current.isAwaitingVerification).toBe(true);
    expect(result.current.lastRequestedEmail).toBe("rebinding@example.com");
  },
);
