/**
 * 背景：
 *  - extractMarkdownPreview 需要在未完全闭合的 JSON 流中定位 markdown 字段，
 *    但原实现将扫描逻辑与解析逻辑耦合，难以拓展到其它字段。
 * 目的：
 *  - 提供职责单一的 Markdown 字段扫描器，组合 jsonStringParser 形成“策略链”。
 * 关键决策与取舍：
 *  - 采用显式游标扫描，避免正则在超长流中退化；
 *  - 以纯函数暴露，方便未来注入不同字段名或空白策略。
 * 影响范围：
 *  - 仅影响 markdown utils 内部结构，对外暴露的 API 与返回语义保持不变。
 * 演进与TODO：
 *  - 若需要支持多字段回退策略，可引入配置对象描述字段列表并在此迭代。
 */

import { readJsonString } from "./jsonStringParser.js";

const MARKDOWN_KEY = '"markdown"';
const WHITESPACE_RE = /\s/;

function seekMarkdownKey(buffer) {
  let index = 0;
  while (index < buffer.length) {
    if (buffer.startsWith(MARKDOWN_KEY, index)) {
      return index + MARKDOWN_KEY.length;
    }
    index += 1;
  }
  return -1;
}

function skipWhitespace(buffer, startIndex) {
  let index = startIndex;
  while (index < buffer.length && WHITESPACE_RE.test(buffer[index])) {
    index += 1;
  }
  return index;
}

/**
 * 意图：在 JSON 文本中找到 markdown 字段的字符串值，兼容 null 与半截字符串。
 * 输入：buffer —— 去除前导空白的 JSON 文本。
 * 输出：
 *  - null：未找到字段或语法不匹配；
 *  - { raw, closed }：找到的原始字符串及闭合状态。
 * 流程：
 *  1) 定位字段名；
 *  2) 跳过冒号与空白；
 *  3) 处理 null 或委托给 jsonStringParser 读取字符串。
 * 错误处理：遇到语法不符时返回 null，等待上层回退策略处理。
 * 复杂度：O(n)。
 */
export function findMarkdownValue(buffer) {
  const keyIndex = seekMarkdownKey(buffer);
  if (keyIndex === -1) {
    return null;
  }
  let index = skipWhitespace(buffer, keyIndex);
  if (buffer[index] !== ":") {
    return null;
  }
  index = skipWhitespace(buffer, index + 1);
  if (index >= buffer.length) {
    return null;
  }
  if (buffer.startsWith("null", index)) {
    return { raw: "", closed: true };
  }
  if (buffer[index] !== '"') return null;
  return readJsonString(buffer, index);
}
