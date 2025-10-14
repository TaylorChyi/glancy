/* eslint-env jest */
import {
  validateEmail,
  validatePhone,
  validateAccount,
  validateUsername,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from "@shared/utils/validators.js";

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
   * 测试目标：验证合法用户名通过校验并返回修剪空白后的结果。
   * 前置条件：输入包含首尾空格的合法用户名。
   * 步骤：
   *  1) 调用 validateUsername 并解析返回值。
   * 断言：
   *  - valid 为 true；
   *  - normalized 等于去除空白后的用户名。
   * 边界/异常：
   *  - 涵盖空白字符处理。
   */
  test("accepts valid usernames and normalizes whitespace", () => {
    const { valid, normalized } = validateUsername("  Taylor  ");
    expect(valid).toBe(true);
    expect(normalized).toBe("Taylor");
  });

  /**
   * 测试目标：确保非法用户名返回对应错误码以驱动 UI 呈现原因。
   * 前置条件：构造空字符串、过短、过长三种输入。
   * 步骤：
   *  1) 分别调用 validateUsername；
   *  2) 收集 code 字段。
   * 断言：
   *  - 空字符串返回 empty；
   *  - 长度小于下界返回 too-short；
   *  - 长度超过上界返回 too-long。
   * 边界/异常：
   *  - 覆盖 min/max 断点。
   */
  test("rejects invalid usernames with descriptive codes", () => {
    expect(validateUsername(" ").code).toBe("empty");
    expect(validateUsername("a".repeat(USERNAME_MIN_LENGTH - 1)).code).toBe(
      "too-short",
    );
    expect(validateUsername("a".repeat(USERNAME_MAX_LENGTH + 1)).code).toBe(
      "too-long",
    );
  });
});
