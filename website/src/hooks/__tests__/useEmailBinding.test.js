import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import useEmailBinding from "@/hooks/useEmailBinding.js";

describe("useEmailBinding", () => {
  const baseUser = { id: 1, token: "token", email: "current@example.com" };

  /**
   * 验证 requestCode 会调用接口并写入倒计时相关状态。
   */
  test("requests verification code for new email", async () => {
    const apiClient = {
      requestEmailChangeCode: jest.fn().mockResolvedValue(undefined),
      confirmEmailChange: jest.fn(),
      unbindEmail: jest.fn(),
    };

    const { result } = renderHook(() =>
      useEmailBinding({ user: baseUser, apiClient, onUserUpdate: jest.fn() }),
    );

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
   * 验证 confirmChange 会在请求验证码后更新用户信息并复位内部状态。
   */
  test("confirms email change", async () => {
    const apiClient = {
      requestEmailChangeCode: jest.fn(),
      confirmEmailChange: jest
        .fn()
        .mockResolvedValue({ email: "fresh@example.com" }),
      unbindEmail: jest.fn(),
    };
    const onUserUpdate = jest.fn();

    const { result } = renderHook(() =>
      useEmailBinding({ user: baseUser, apiClient, onUserUpdate }),
    );

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
  test("throws when confirm is invoked before requesting code", async () => {
    const apiClient = {
      requestEmailChangeCode: jest.fn(),
      confirmEmailChange: jest.fn(),
      unbindEmail: jest.fn(),
    };

    const { result } = renderHook(() =>
      useEmailBinding({ user: baseUser, apiClient, onUserUpdate: jest.fn() }),
    );

    await expect(
      act(() =>
        result.current.confirmChange({
          email: "fresh@example.com",
          code: "123456",
        }),
      ),
    ).rejects.toThrow("email-binding-code-missing-request");
  });

  /**
   * 验证 confirmChange 在验证码邮箱不匹配时会抛出邮箱不一致错误。
   */
  test("throws when confirmation email differs from requested one", async () => {
    const apiClient = {
      requestEmailChangeCode: jest.fn().mockResolvedValue(undefined),
      confirmEmailChange: jest.fn(),
      unbindEmail: jest.fn(),
    };

    const { result } = renderHook(() =>
      useEmailBinding({ user: baseUser, apiClient, onUserUpdate: jest.fn() }),
    );

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
  });

  /**
   * 验证 unbindEmail 会清空绑定邮箱并触发回调。
   */
  test("unbinds email", async () => {
    const apiClient = {
      requestEmailChangeCode: jest.fn(),
      confirmEmailChange: jest.fn(),
      unbindEmail: jest.fn().mockResolvedValue({ email: null }),
    };
    const onUserUpdate = jest.fn();

    const { result } = renderHook(() =>
      useEmailBinding({ user: baseUser, apiClient, onUserUpdate }),
    );

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
});
