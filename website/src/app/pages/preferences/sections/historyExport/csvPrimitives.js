/**
 * 意图：按照 RFC 4180 约定对 CSV 字段做最小必要的转义。
 * 输入：任意值（包括 null/undefined/布尔/数字/对象）。
 * 输出：字符串；若包含特殊字符则以双引号包裹并对内嵌引号加倍。
 * 流程：
 *  1) 将值转为字符串；
 *  2) 匹配需转义的字符；
 *  3) 如命中，则包裹并替换；否则直接返回。
 * 错误处理：无副作用，调用方自行兜底。
 * 复杂度：O(n)，n 为字段长度。
 */
export const normalizeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

/**
 * 意图：将一组字段转化为 CSV 行文本。
 * 输入：任意可迭代的字段集合。
 * 输出：拼接后的单行字符串。
 * 流程：对每个字段执行 normalizeCsvValue 后用逗号拼接。
 * 错误处理：调用方需确保传入数组，函数本身保持纯净。
 * 复杂度：O(m * n)，m 为字段数量，n 为字段平均长度。
 */
export const toCsvRow = (values) =>
  Array.from(values, (value) => normalizeCsvValue(value)).join(",");
