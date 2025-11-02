/**
 * 背景：
 *  - extractMarkdownPreview 原始实现内联了 JSON 字符串解码与游标扫描逻辑，
 *    当文件拆分时仍然存在复杂度堆叠，导致结构化 lint 无法关闭豁免。
 * 目的：
 *  - 提供独立的 JSON 字符串读写器，复用在 Markdown 解析与其它潜在流式协议中。
 * 关键决策与取舍：
 *  - 采用“解析器策略”拆分：将字符串解码与字段扫描职责解耦，便于组合与测试；
 *  - 保留最小依赖（纯字符串操作），避免在半截流响应中触发 JSON.parse 异常。
 * 影响范围：
 *  - 仅影响 shared/utils/markdown 下的解析实现，对上层调用保持透传接口。
 * 演进与TODO：
 *  - 后续若协议新增二进制 escape 序列，可在此模块追加映射策略并以特性开关控制。
 */

const SIMPLE_ESCAPE_MAPPINGS = new Map([
  ["\\", "\\"],
  ['"', '"'],
  ["'", "'"],
  ["/", "/"],
  ["b", "\b"],
  ["f", "\f"],
  ["n", "\n"],
  ["r", "\r"],
  ["t", "\t"],
]);

/**
 * 意图：解析 JSON 字符串内的 Unicode escape 序列，保障在流式场景下的最小健壮性。
 * 输入：
 *  - raw：原始字符串；
 *  - startIndex：Unicode 序列起点。
 * 输出：
 *  - char：解析后的字符；
 *  - advance：游标需要前进的位数。
 * 流程：
 *  1) 切取 4 位候选码点；
 *  2) 校验合法性，不合法时退回原样；
 *  3) 将合法码点转换为字符。
 * 错误处理：非法码点按原样返回，避免吞掉数据；
 * 复杂度：O(1)。
 */
function decodeUnicodeSequence(raw, startIndex) {
  const code = raw.slice(startIndex, startIndex + 4);
  const isValid = code.length === 4 && /^[0-9a-fA-F]+$/.test(code);
  if (!isValid) {
    return { char: "\\u", advance: 1 };
  }
  return {
    char: String.fromCharCode(parseInt(code, 16)),
    advance: 5,
  };
}

/**
 * 意图：处理 JSON 字符串内的转义序列，输出对应字符。
 * 输入：
 *  - raw：原始字符串；
 *  - index：当前游标位置，指向反斜杠。
 * 输出：
 *  - char：转义后的字符；
 *  - advance：游标需向前移动的距离。
 * 流程：
 *  1) 判断是否为末尾半截转义，若是则直接返回反斜杠；
 *  2) 匹配 Unicode 序列；
 *  3) 查找简单映射表或按原字符返回。
 * 错误处理：末尾半截转义保持原样，等待后续补全；
 * 复杂度：O(1)。
 */
function decodeEscapedSequence(raw, index) {
  const next = raw[index + 1];
  if (next === undefined) {
    return { char: "\\", advance: 0 };
  }
  if (next === "u") {
    return decodeUnicodeSequence(raw, index + 2);
  }
  const mapped = SIMPLE_ESCAPE_MAPPINGS.get(next);
  if (mapped !== undefined) {
    return { char: mapped, advance: 1 };
  }
  return { char: next, advance: 1 };
}

/**
 * 意图：将 JSON 字符串内容转换为实际文本，复原所有转义字符。
 * 输入：raw —— 原始 JSON 字符串内容（不含首尾引号）。
 * 输出：解码后的字符串。
 * 流程：遍历字符，遇到反斜杠时交由 decodeEscapedSequence 处理并推进游标。
 * 错误处理：保持未识别转义为原字符，避免丢失数据。
 * 复杂度：O(n)。
 */
export function decodeJsonString(raw) {
  let result = "";
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (char !== "\\") {
      result += char;
      continue;
    }
    const { char: decoded, advance } = decodeEscapedSequence(raw, i);
    result += decoded;
    i += advance;
  }
  return result;
}

/**
 * 意图：在原始 JSON 文本中截取字符串字段的原始片段，兼容半截流式输入。
 * 输入：
 *  - source：包含引号的源字符串；
 *  - startIndex：当前字段的起始引号位置。
 * 输出：
 *  - raw：截取到的字符串内容（未解码，包含转义）；
 *  - closed：布尔值，指示是否读取到了闭合引号。
 * 流程：
 *  1) 从起始位置后逐字扫描；
 *  2) 捕获转义符并保留原样；
 *  3) 遇到闭合引号时停止并标记。
 * 错误处理：遇到输入结束仍未闭合时返回当前片段，由调用方决定后续补偿。
 * 复杂度：O(n)。
 */
export function readJsonString(source, startIndex) {
  let result = "";
  let index = startIndex + 1;
  let closed = false;
  while (index < source.length) {
    const char = source[index];
    if (char === "\\") {
      const next = source[index + 1];
      if (next === undefined) {
        result += "\\";
        break;
      }
      result += char;
      result += next;
      index += 2;
      continue;
    }
    if (char === '"') {
      closed = true;
      index += 1;
      break;
    }
    result += char;
    index += 1;
  }
  return { raw: result, closed };
}
