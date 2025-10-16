/**
 * 背景：
 *  - 错误文案拼装原本散落在 UsernameEditor 组件内部，增加视图函数的分支复杂度；
 *  - lint 迁移后需要降低主组件认知负担，便于拆分测试与复用。
 * 目的：
 *  - 提供集中式的错误消息解析器，根据状态机输出与多语言文案映射生成提示；
 *  - 通过纯函数实现，方便在单测与未来其它调用点复用。
 * 关键决策与取舍：
 *  - 依赖 validators 中的常量以保持长度约束同步；
 *  - 保留对自定义 message 的透传能力，兼容服务端返回的语义化错误。
 * 影响范围：
 *  - UsernameEditor 控制器 hook 与可能新增的错误展示单元测试。
 * 演进与TODO：
 *  - 若后续引入错误分级或可配置映射，可在此扩展策略表而不改动视图层。
 */
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
