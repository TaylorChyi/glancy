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
