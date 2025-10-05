const EMAIL_REGEX = /.+@.+\..+/;
const PHONE_REGEX = /^\+?\d{6,15}$/;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 50;

export function validateEmail(email) {
  return EMAIL_REGEX.test(email);
}

export function validatePhone(phone) {
  return PHONE_REGEX.test(phone);
}

export function validateAccount(account, method) {
  if (method === "email") return validateEmail(account);
  if (method === "phone") return validatePhone(account);
  return true;
}

/**
 * 意图：对用户名进行前端快速校验，并返回语义化结果，避免在交互层散落魔法数。
 * 输入：候选用户名字符串，允许 undefined / null，并在函数内部进行去空白处理。
 * 输出：包含是否通过、失败原因代码及规范化后的用户名，以便调用方做后续处理。
 * 流程：
 *  1) 去除首尾空白并处理空值。
 *  2) 针对长度上下界做边界判断。
 *  3) 返回语义化对象供 UI 或状态机消费。
 * 错误处理：失败时提供 `code`，调用方可映射到本地化文案或其他处理逻辑。
 * 复杂度：O(n) 时间复杂度（遍历一次字符串），O(1) 额外空间。
 */
export function validateUsername(username) {
  const normalized = username?.trim() ?? "";
  if (normalized.length === 0) {
    return { valid: false, code: "empty", normalized };
  }
  if (normalized.length < USERNAME_MIN_LENGTH) {
    return { valid: false, code: "too-short", normalized };
  }
  if (normalized.length > USERNAME_MAX_LENGTH) {
    return { valid: false, code: "too-long", normalized };
  }
  return { valid: true, normalized };
}
