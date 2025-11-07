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
