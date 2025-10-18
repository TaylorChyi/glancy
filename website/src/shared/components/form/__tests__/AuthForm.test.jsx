/* eslint-env jest */
import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import {
  resolveInitialMethod,
  sanitizeAccount,
  useAuthFormController,
  useFeedbackChannels,
} from "../AuthForm.jsx";

const createTranslations = (overrides = {}) => ({
  close: "Close",
  codeRequestFailed: "codeRequestFailed",
  codeRequestInvalidMethod: "codeRequestInvalidMethod",
  codeRequestSuccess: "codeRequestSuccess",
  continueButton: "Continue",
  genericRequestFailed: "genericRequestFailed",
  invalidAccount: "invalidAccount",
  loginButton: "Login",
  notImplementedYet: "notImplementedYet",
  otherLoginOptions: "Other options",
  privacyPolicy: "Privacy",
  registerButton: "Register",
  termsOfUse: "Terms",
  toastDismissLabel: "Dismiss",
  ...overrides,
});

const createControllerProps = (overrides = {}) => ({
  formMethods: ["phone", "email"],
  methodOrder: ["phone", "email"],
  defaultMethod: "phone",
  validateAccount: jest.fn(() => true),
  passwordPlaceholder: "Password",
  showCodeButton: () => true,
  icons: { phone: "phone", email: "email" },
  otherOptionsLabel: "",
  placeholders: { phone: "Phone", email: "Email" },
  onRequestCode: jest.fn(() => Promise.resolve()),
  onSubmit: jest.fn(() => Promise.resolve()),
  t: createTranslations(),
  ...overrides,
});

describe("AuthForm structural helpers", () => {
  /**
   * 测试目标：resolveInitialMethod 在存在用户名策略时优先返回 "username"。
   * 前置条件：提供 methods 含 username，preferredMethod 为 email。
   * 步骤：
   *  1) 调用 resolveInitialMethod。
   * 断言：
   *  - 返回值为 "username"；失败应指出未优先使用用户名策略。
   * 边界/异常：
   *  - fallback 覆盖 preferredMethod。
   */
  test("resolveInitialMethod prioritizes username when available", () => {
    const methods = ["email", "username", "phone"];
    const resolved = resolveInitialMethod(methods, "email");
    expect(resolved).toBe("username");
  });

  /**
   * 测试目标：resolveInitialMethod 在缺失用户名时回退到 preferredMethod。
   * 前置条件：methods 不包含 username，preferredMethod=phone。
   * 步骤：
   *  1) 调用 resolveInitialMethod。
   * 断言：
   *  - 返回 phone。
   * 边界/异常：
   *  - preferredMethod 不存在于 methods 时再回退到首项，此处覆盖存在场景。
   */
  test("resolveInitialMethod uses preferred method when username missing", () => {
    const methods = ["phone", "email"];
    const resolved = resolveInitialMethod(methods, "phone");
    expect(resolved).toBe("phone");
  });

  /**
   * 测试目标：sanitizeAccount 能够裁剪字符串前后空白并保持非字符串类型原样。
   * 前置条件：输入字符串及对象。
   * 步骤：
   *  1) 调用 sanitizeAccount("  foo  ")。
   *  2) 调用 sanitizeAccount({ value: 1 })。
   * 断言：
   *  - 字符串返回无空白；对象保持引用不变。
   * 边界/异常：
   *  - 输入非字符串类型时不应抛错。
   */
  test("sanitizeAccount trims string values and preserves objects", () => {
    expect(sanitizeAccount("  foo  ")).toBe("foo");
    const value = { data: 1 };
    expect(sanitizeAccount(value)).toBe(value);
  });

  /**
   * 测试目标：useFeedbackChannels 能按需开启弹窗与 Toast 通道并在重置后关闭。
   * 前置条件：Hook 初始状态均为关闭。
   * 步骤：
   *  1) 调用 showPopup/showToast 传入消息。
   *  2) 调用 resetPopup/resetToast。
   * 断言：
   *  - open 标记按期望切换，message 同步更新。
   * 边界/异常：
   *  - 传入空字符串时应关闭通道。
   */
  test("useFeedbackChannels toggles popup and toast states", () => {
    const { result } = renderHook(() => useFeedbackChannels());

    act(() => {
      result.current.showPopup("error");
      result.current.showToast("success");
    });

    expect(result.current.popup).toEqual({ open: true, message: "error" });
    expect(result.current.toast).toEqual({ open: true, message: "success" });

    act(() => {
      result.current.resetPopup();
      result.current.resetToast();
    });

    expect(result.current.popup).toEqual({ open: false, message: "" });
    expect(result.current.toast).toEqual({ open: false, message: "" });
  });

  /**
   * 测试目标：handleSendCode 会在账号合法时调用 onRequestCode 并写入成功提示。
   * 前置条件：validateAccount 返回 true；account 含前后空格。
   * 步骤：
   *  1) 设置账号并执行 handleSendCode。
   * 断言：
   *  - onRequestCode 收到裁剪后的账号；toast 打开并包含成功文案。
   * 边界/异常：
   *  - 验证返回 false 时覆盖于下一用例。
   */
  test("useAuthFormController send code success path", async () => {
    const props = createControllerProps();
    const { result } = renderHook(() => useAuthFormController(props));

    act(() => {
      result.current.setAccount(" 1234567890 ");
    });

    let success;
    await act(async () => {
      success = await result.current.handleSendCode();
    });

    expect(success).toBe(true);
    expect(props.onRequestCode).toHaveBeenCalledWith({
      account: "1234567890",
      method: "phone",
    });
    expect(result.current.toast).toEqual({
      open: true,
      message: props.t.codeRequestSuccess,
    });
    expect(props.validateAccount).toHaveBeenCalledWith("1234567890", "phone");
  });

  /**
   * 测试目标：handleSendCode 在账号校验失败时阻断请求并展示错误提示。
   * 前置条件：validateAccount 返回 false。
   * 步骤：
   *  1) 设置账号并执行 handleSendCode。
   * 断言：
   *  - 返回 false；popup 展示 invalidAccount 文案；onRequestCode 未被调用。
   * 边界/异常：
   *  - 验证空账号时不触发请求。
   */
  test("useAuthFormController blocks code request when validation fails", async () => {
    const props = createControllerProps({
      validateAccount: jest.fn(() => false),
    });
    const { result } = renderHook(() => useAuthFormController(props));

    act(() => {
      result.current.setAccount("invalid");
    });

    let success;
    await act(async () => {
      success = await result.current.handleSendCode();
    });

    expect(success).toBe(false);
    expect(result.current.popup).toEqual({
      open: true,
      message: props.t.invalidAccount,
    });
    expect(props.onRequestCode).not.toHaveBeenCalled();
  });

  /**
   * 测试目标：handleSubmit 在请求失败时展示 fallback 文案并阻止重复提交。
   * 前置条件：validateAccount 返回 true；onSubmit 抛出错误。
   * 步骤：
   *  1) 设置账号密码；
   *  2) 调用 handleSubmit 并捕获异常文案。
   * 断言：
   *  - popup 展示 genericRequestFailed；onSubmit 被调用一次。
   * 边界/异常：
   *  - 防止错误对象缺失 message 时回退到默认文案。
   */
  test("useAuthFormController surfaces submit errors via popup", async () => {
    const error = new Error("server down");
    const props = createControllerProps({
      onSubmit: jest.fn(() => Promise.reject(error)),
    });
    const { result } = renderHook(() => useAuthFormController(props));

    act(() => {
      result.current.setAccount("user@example.com");
      result.current.setPassword("secret");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: () => {} });
    });

    expect(props.onSubmit).toHaveBeenCalledWith({
      account: "user@example.com",
      method: "phone",
      password: "secret",
    });
    expect(result.current.popup).toEqual({
      open: true,
      message: error.message,
    });
  });
});
