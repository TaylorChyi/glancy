/**
 * 背景：
 *  - 单体 en.js 文件曾堆叠全部词条，触发 lint 的结构化行数限制并降低可维护性。
 * 目的：
 *  - 采用组合式模块化策略，将词条按业务子域拆分，再在此处聚合导出。
 * 关键决策与取舍：
 *  - 选用对象合成（composition）代替继承或动态代理，保持加载时零额外开销；
 *  - 模块拆分遵循“领域聚合”原则，便于按需扩展或独立测试。
 * 影响范围：
 *  - 所有引用公共 en 词条的调用方；导出接口保持不变。
 * 演进与TODO：
 *  - 后续可引入类型校验脚本，确保多语言包键名一致。
 */
import administration from "./en/administration";
import preferences from "./en/preferences";
import dictionary from "./en/dictionary";
import account from "./en/account";
import subscription from "./en/subscription";
import share from "./en/share";
import report from "./en/report";
import shortcuts from "./en/shortcuts";
import cookie from "./en/cookie";
import clipboard from "./en/clipboard";

export default {
  ...administration,
  ...preferences,
  ...dictionary,
  ...account,
  ...subscription,
  ...share,
  ...report,
  ...shortcuts,
  ...cookie,
  ...clipboard,
};
