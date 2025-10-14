/**
 * 背景：
 *  - 流式 Markdown 需要在视觉层面区分逐词输出，以便后续实现词级高亮或动画效果。
 * 目的：
 *  - 提供一个 Rehype 插件，将文本节点按空白符拆分为词级片段，并以 span 包裹词语。
 * 关键决策与取舍：
 *  - 采用“访问者模式”遍历 HAST，避免在 React 渲染阶段重复处理；
 *  - 跳过 code/pre 等语义节点，防止破坏代码块原始格式；
 * 影响范围：
 *  - 仅影响经 MarkdownStream 渲染的流式内容，其它 MarkdownRenderer 调用保持原状；
 * 演进与TODO：
 *  - 后续可扩展为可配置的粒度策略（按语种或词性分组）。
 */
import { visit } from "unist-util-visit";

const STREAM_WORD_CLASS = "stream-word";
const WHITESPACE_RE = /^\s+$/u;
const WHITESPACE_SPLITTER = /(\s+)/u;
const SKIP_TAGS = new Set(["code", "pre", "kbd", "samp"]);

function createWordNode(value) {
  return {
    type: "element",
    tagName: "span",
    properties: { className: [STREAM_WORD_CLASS] },
    children: [{ type: "text", value }],
  };
}

function segmentValue(value) {
  if (!value) return null;
  const parts = value.split(WHITESPACE_SPLITTER).filter(Boolean);
  if (parts.length <= 1) {
    return null;
  }

  const nodes = parts.map((segment) =>
    WHITESPACE_RE.test(segment)
      ? { type: "text", value: segment }
      : createWordNode(segment),
  );

  return nodes;
}

export default function rehypeStreamWordSegments() {
  return (tree) => {
    visit(tree, "text", (node, index, parent) => {
      if (!parent || typeof node.value !== "string" || !node.value) {
        return;
      }

      if (parent.type === "element" && SKIP_TAGS.has(parent.tagName)) {
        return;
      }

      const replacements = segmentValue(node.value);
      if (!replacements) {
        return;
      }

      parent.children.splice(index, 1, ...replacements);
      return index + replacements.length;
    });
  };
}

export const __internal__testables = {
  segmentValue,
  createWordNode,
};
