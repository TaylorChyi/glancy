/**
 * 测试目标：
 *  - 校验 useEmailBindingWorkflow 暴露的请求/确认/解绑逻辑。
 * 前置条件：
 *  - 使用伪造 emailBinding 对象及通知函数。
 * 步骤：
 *  1) requestCode 传空值与正常值；
 *  2) confirmChange 触发成功与失败路径；
 *  3) unbind 成功路径。
 * 断言：
 *  - 通知函数收到正确文案，返回值符合预期。
 * 边界/异常：
 *  - 异常路径调用 notifyFailure。
 */
import { jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { useEmailBindingWorkflow } from "../useEmailBindingWorkflow.js";

const t = {
  emailInputRequired: "input-required",
  emailCodeSent: "code-sent",
  emailChangeSuccess: "change-success",
  emailBindSuccess: "bind-success",
  emailUnbindSuccess: "unbind-success",
  fail: "fail",
};

const baseEmailBinding = {
  requestCode: jest.fn(),
  confirmChange: jest.fn(),
  unbindEmail: jest.fn(),
  startEditing: jest.fn(),
  cancelEditing: jest.fn(),
  mode: "idle",
  isSendingCode: false,
  isVerifying: false,
  isUnbinding: false,
  isAwaitingVerification: false,
  requestedEmail: "",
};

const renderWorkflow = (overrides = {}) => {
  const emailBinding = { ...baseEmailBinding, ...overrides };
  const notifySuccess = jest.fn();
  const notifyFailure = jest.fn();
  const hook = renderHook(() =>
    useEmailBindingWorkflow({
      emailBinding,
      currentUser: { email: "foo@bar" },
      notifySuccess,
      notifyFailure,
      t,
    }),
  );
  return { ...hook, emailBinding, notifySuccess, notifyFailure };
};

describe("useEmailBindingWorkflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requestCode 输入为空时提示失败", async () => {
    const { result, notifyFailure } = renderWorkflow();
    await act(async () => {
      const outcome = await result.current.requestCode("");
      expect(outcome).toBe(false);
    });
    expect(notifyFailure).toHaveBeenCalledWith("input-required");
  });

  it("requestCode 成功时返回 true 并提示成功", async () => {
    const { result, emailBinding, notifySuccess } = renderWorkflow({
      requestCode: jest.fn().mockResolvedValue(undefined),
    });
    await act(async () => {
      const outcome = await result.current.requestCode("foo@bar");
      expect(outcome).toBe(true);
    });
    expect(emailBinding.requestCode).toHaveBeenCalledWith("foo@bar");
    expect(notifySuccess).toHaveBeenCalledWith("code-sent");
  });

  it("confirmChange 失败时回退到错误提示", async () => {
    const error = new Error("boom");
    const { result, emailBinding, notifyFailure } = renderWorkflow({
      confirmChange: jest.fn().mockRejectedValue(error),
    });
    jest.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      await result.current.confirmChange({ email: "foo", code: "123" });
    });
    expect(emailBinding.confirmChange).toHaveBeenCalledWith({
      email: "foo",
      code: "123",
    });
    expect(notifyFailure).toHaveBeenCalledWith("boom");
    console.error.mockRestore();
  });

  it("unbind 成功时提示成功并重置编辑态", async () => {
    const { result, emailBinding, notifySuccess } = renderWorkflow({
      unbindEmail: jest.fn().mockResolvedValue(undefined),
    });
    await act(async () => {
      await result.current.unbind();
    });
    expect(emailBinding.unbindEmail).toHaveBeenCalled();
    expect(emailBinding.startEditing).toHaveBeenCalled();
    expect(notifySuccess).toHaveBeenCalledWith("unbind-success");
  });
});
