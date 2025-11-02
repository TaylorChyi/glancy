/**
 * 背景：
 *  - Markdown 中的长词与多字节文本会在 flex 布局下溢出，
 *    需要在渲染时注入零宽断行符提供潜在折行点。
 * 目的：
 *  - 提供纯函数版本的断行注入器，供不同渲染器重用并便于单测覆盖。
 * 关键决策与取舍：
 *  - 优先使用 Intl.Segmenter 处理多语言字素，缺失时回退到 Array.from；
 *  - 保持对 code/pre 标签的跳过逻辑，避免破坏代码块格式；
 *  - 仅在非空白字符之间插入断点，确保英文空格不被吞噬。
 * 影响范围：
 *  - MarkdownRenderer 在动态模式下的换行表现。
 */
import { Children, cloneElement, isValidElement } from "react";

const ZERO_WIDTH_SPACE = "\u200B";
const WHITESPACE_ONLY = /^\s+$/u;
const SKIPPED_TAGS = new Set(["code", "pre"]);

export default function createBreakInjector() {
  const segmenter = createSegmenter();
  const splitText = (text) => splitWithSegmenter(segmenter, text);
  const processChildren = createChildrenProcessor(splitText);

  return (children) => processChildren(children, "node");
}

function createSegmenter() {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") {
    return null;
  }
  return new Intl.Segmenter(undefined, { granularity: "grapheme" });
}

function splitWithSegmenter(segmenter, text) {
  if (!text) {
    return [];
  }
  if (!segmenter) {
    return Array.from(text);
  }
  return Array.from(segmenter.segment(text), (segment) => segment.segment);
}

function joinSegmentsWithBreaks(segments) {
  return segments.slice(1).reduce((acc, segment, index) => {
    const previous = segments[index];
    if (shouldJoinWithBreak(previous, segment)) {
      return acc + ZERO_WIDTH_SPACE + segment;
    }
    return acc + segment;
  }, segments[0]);
}

function processTextNode(text, splitText) {
  if (!text || text.includes(ZERO_WIDTH_SPACE)) {
    return text;
  }

  const segments = splitText(text);
  if (segments.length <= 1) {
    return text;
  }

  return joinSegmentsWithBreaks(segments);
}

function processElementNode(node, keyPrefix, processChildren) {
  if (shouldSkipNode(node) || !node.props?.children) {
    return node;
  }

  const processedChildren = processChildren(
    node.props.children,
    `${keyPrefix}-child`,
  );
  return cloneElement(node, node.props, processedChildren);
}

function createChildrenProcessor(splitText) {
  function processNode(node, keyPrefix) {
    if (typeof node === "string" || typeof node === "number") {
      return processTextNode(String(node), splitText);
    }
    if (isValidElement(node)) {
      return processElementNode(node, keyPrefix, processChildren);
    }
    return node;
  }

  function processChildren(children, keyPrefix) {
    return Children.toArray(children).flatMap((child, index) =>
      processNode(child, `${keyPrefix}-${index}`),
    );
  }

  return processChildren;
}

function shouldJoinWithBreak(previous, current) {
  if (typeof previous !== "string" || typeof current !== "string") {
    return false;
  }
  return !(WHITESPACE_ONLY.test(previous) || WHITESPACE_ONLY.test(current));
}

function shouldSkipNode(node) {
  return typeof node.type === "string" && SKIPPED_TAGS.has(node.type);
}
