/**
 * 背景：
 *  - 历史导出需兼顾 Excel 与文本文档的兼容性，必须统一处理换行与引号转义。
 * 目的：
 *  - 提供 CSV 字段的最小化原语，约束导出策略在同一转义规范下运作。
 * 关键决策与取舍：
 *  - 以不可变纯函数暴露能力，确保组合导出策略时无隐式状态；
 *  - 暂不引入第三方 CSV 库，避免体积膨胀，并保持可控的换行策略。
 * 影响范围：
 *  - 偏好设置页面下所有 CSV 导出策略的字段规范化逻辑。
 * 演进与TODO：
 *  - 如后续扩展至 TSV/多语言分隔符，可在此抽象更通用的格式化层。
 */

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
