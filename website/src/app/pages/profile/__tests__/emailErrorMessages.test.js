/**
 * 测试目标：
 *  - 验证 resolveEmailErrorMessage 根据错误码返回正确文案。
 * 前置条件：
 *  - 构造带有 code/message 的错误对象以及翻译对象。
 * 步骤：
 *  1) 传入已映射错误码；
 *  2) 传入未知错误码与 message；
 *  3) 传入空错误。
 * 断言：
 *  - 返回值分别为映射文案、错误消息、默认失败文案。
 * 边界/异常：
 *  - 未知错误码走回退逻辑。
 */
import { resolveEmailErrorMessage } from "../emailErrorMessages.js";

describe("resolveEmailErrorMessage", () => {
  const t = {
    fail: "default-fail",
    emailInputRequired: "input-required",
    emailCodeMismatch: "code-mismatch",
  };

  it("命中映射时返回翻译文案", () => {
    const message = resolveEmailErrorMessage(
      { code: "email-binding-email-required" },
      t,
    );
    expect(message).toBe("input-required");
  });

  it("未知错误码时回退到 message", () => {
    const message = resolveEmailErrorMessage(
      { code: "unknown", message: "server error" },
      t,
    );
    expect(message).toBe("server error");
  });

  it("无错误对象时返回默认失败文案", () => {
    const message = resolveEmailErrorMessage(null, t);
    expect(message).toBe("default-fail");
  });
});
