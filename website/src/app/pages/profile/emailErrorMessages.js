/**
 * 背景：
 *  - 邮箱绑定流程的错误码散落在页面组件内，重复条件判断增加维护成本。
 * 目的：
 *  - 集中维护错误码与本地化文案的映射，便于复用与单测。
 * 关键决策与取舍：
 *  - 采用对象映射替代 if-else 链，提升可读性并方便后续扩展；
 *  - 若错误码未命中则回退到 message 或默认文案，兼容后端潜在变更。
 * 影响范围：
 *  - Profile 页面邮箱绑定提示的消息来源统一集中，未来其他入口可共享此逻辑。
 * 演进与TODO：
 *  - TODO: 后续可将错误码配置化，以支持多终端共享并同步运营录入。
 */
export const EMAIL_ERROR_CODE_TO_TRANSLATION_KEY = Object.freeze({
  "email-binding-email-required": "emailInputRequired",
  "email-binding-email-unchanged": "emailSameAsCurrent",
  "email-binding-code-required": "emailCodeRequired",
  "email-binding-code-missing-request": "emailCodeNotRequested",
  "email-binding-email-mismatch": "emailCodeMismatch",
});

export function resolveEmailErrorMessage(error, t) {
  if (!error) {
    return t.fail;
  }
  const translationKey = EMAIL_ERROR_CODE_TO_TRANSLATION_KEY[error.code];
  if (translationKey && t[translationKey]) {
    return t[translationKey];
  }
  if (error.message) {
    return error.message;
  }
  return t.fail;
}
