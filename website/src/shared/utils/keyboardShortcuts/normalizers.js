/**
 * 背景：
 *  - 键位规范化需要在事件解析、字符串展示等多个环节使用，原先逻辑难以复用。
 * 目的：
 *  - 提供纯函数式的键位规范化能力，确保输入变体统一映射到语义化 token。
 * 关键决策与取舍：
 *  - 维持与历史行为一致的替换表，避免影响既有快捷键配置；
 *  - 保留 MOD/CTRL 等别名，兼顾跨平台文案。
 * 影响范围：
 *  - 事件捕获、格式化展示、配置合并等所有对键位 token 有依赖的流程。
 * 演进与TODO：
 *  - 若未来支持函数键集合或多组合键，可在此扩展映射表并保持纯函数语义。
 */

const KEY_ALIAS_MAP = new Map([
  ["CMD", "META"],
  ["COMMAND", "META"],
  ["CTRL", "CONTROL"],
  ["OPTION", "ALT"],
  ["RETURN", "ENTER"],
  ["ESC", "ESCAPE"],
  ["SPACEBAR", "SPACE"],
  ["ARROWDOWN", "ARROW_DOWN"],
  ["ARROWUP", "ARROW_UP"],
  ["ARROWLEFT", "ARROW_LEFT"],
  ["ARROWRIGHT", "ARROW_RIGHT"],
]);

const EMPTY_TOKENS = new Set(["", "_"]);

/**
 * 意图：将输入的键位描述转换为统一的快捷键 token。
 * 输入：raw —— 用户输入或浏览器事件提供的原始键位字符串。
 * 输出：标准化后的 token，若无法识别则返回空字符串。
 * 流程：
 *  1) 校验输入类型并移除首尾空格；
 *  2) 将空白统一替换为下划线并大写；
 *  3) 根据映射表处理常见别名与例外；
 *  4) 对非法字符进行清洗。
 * 错误处理：遇到不可识别字符时返回空字符串，交由调用方兜底。
 * 复杂度：O(n)，n 为输入长度。
 */
export function normalizeKeyToken(raw) {
  if (typeof raw !== "string") {
    return "";
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  const upper = trimmed.replace(/\s+/g, "_").toUpperCase();
  const sanitized = upper.replaceAll(/[^A-Z0-9_]/g, "");
  if (EMPTY_TOKENS.has(sanitized)) {
    return "";
  }
  const alias = KEY_ALIAS_MAP.get(sanitized);
  if (alias) {
    return alias;
  }
  return sanitized;
}
