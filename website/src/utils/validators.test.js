/* eslint-env jest */
import {
  validateEmail,
  validatePhone,
  validateAccount,
  validateUsername,
} from "@/utils/validators.js";

describe("validateEmail", () => {
  it("validates email format", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("invalid-email")).toBe(false);
  });
});

describe("validatePhone", () => {
  it("validates phone numbers", () => {
    expect(validatePhone("+12345678901")).toBe(true);
    expect(validatePhone("12345")).toBe(false);
  });
});

describe("validateAccount", () => {
  it("handles email method", () => {
    expect(validateAccount("test@example.com", "email")).toBe(true);
    expect(validateAccount("bademail", "email")).toBe(false);
  });

  it("handles phone method", () => {
    expect(validateAccount("+12345678901", "phone")).toBe(true);
    expect(validateAccount("12345", "phone")).toBe(false);
  });

  it("defaults to true for other methods", () => {
    expect(validateAccount("anything", "username")).toBe(true);
  });
});

describe("validateUsername", () => {
  /**
   * 测试目标：校验用户名格式允许 3-20 位字母、数字或下划线，拒绝其他情况。
   * 前置条件：传入不同类型与长度的用户名样例。
   * 步骤：
   *  1) 传入符合规则的用户名。
   *  2) 传入过短、包含非法字符与非字符串的输入。
   * 断言：
   *  - 合规样例返回 true。
   *  - 不合规样例返回 false。
   * 边界/异常：
   *  - 非字符串输入应直接返回 false。
   */
  it("GivenVariousInputs_WhenValidating_ThenRespectUsernamePolicy", () => {
    expect(validateUsername("Taylor_001")).toBe(true);
    expect(validateUsername("ab")).toBe(false);
    expect(validateUsername("user@name")).toBe(false);
    expect(validateUsername(12345)).toBe(false);
  });
});
