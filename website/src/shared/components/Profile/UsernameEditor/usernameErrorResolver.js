import {
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from "@shared/utils/validators.js";

/**
 * 意图：根据状态机错误与国际化文案生成用户可见的提示信息。
 * 输入：
 *  - t：包含多语言文案的对象；
 *  - error：状态机返回的错误对象，支持 { code } 或 { message } 结构；
 * 输出：本地化后的错误字符串，若无错误则返回空字符串。
 */
export function resolveUsernameErrorMessage(t, error) {
  if (!error) return "";
  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  switch (error.code) {
    case "empty":
      return t.usernameValidationEmpty;
    case "too-short":
      return t.usernameValidationTooShort.replace(
        "{{min}}",
        String(USERNAME_MIN_LENGTH),
      );
    case "too-long":
      return t.usernameValidationTooLong.replace(
        "{{max}}",
        String(USERNAME_MAX_LENGTH),
      );
    default:
      return t.usernameUpdateFailed;
  }
}
