/**
 * 背景：
 *  - 动态 Markdown 渲染需要在多个标签内注入断行逻辑并装配折叠组件。
 * 目的：
 *  - 统一生成传递给 ReactMarkdown 的 components 映射，
 *    以便集中维护可折叠节点与断行注入策略。
 * 关键决策与取舍：
 *  - 使用工厂函数按需创建 BreakableElement，避免重复代码；
 *  - 保留 collapsible-* 自定义标签的映射，兼容 rehype 插件输出；
 *  - PropTypes 仍挂载在组件上，方便单测与调用方了解契约。
 * 影响范围：
 *  - MarkdownRenderer 在动态模式下的组件映射。
 * 演进与TODO：
 *  - 如需新增可断行标签，可在 BREAKABLE_TAGS 中扩展。
 */
import PropTypes from "prop-types";

import CollapsibleSection from "./CollapsibleSection.jsx";
import CollapsibleBody from "./CollapsibleBody.jsx";
import createSummaryRenderer from "./createSummaryRenderer.js";

const BREAKABLE_TAGS = [
  "p",
  "li",
  "dd",
  "dt",
  "th",
  "td",
  "caption",
  "figcaption",
  "blockquote",
];

export default function buildMarkdownComponents({ injectBreaks }) {
  const components = Object.fromEntries(
    BREAKABLE_TAGS.map((tag) => {
      const BreakableElement = function BreakableElement({
        children,
        ...elementProps
      }) {
        const Tag = tag;
        return <Tag {...elementProps}>{injectBreaks(children)}</Tag>;
      };

      BreakableElement.propTypes = {
        children: PropTypes.node,
      };

      return [tag, BreakableElement];
    }),
  );

  return {
    ...components,
    "collapsible-section": (props) => (
      <CollapsibleSection {...props} injectBreaks={injectBreaks} />
    ),
    "collapsible-summary": createSummaryRenderer(injectBreaks),
    "collapsible-body": CollapsibleBody,
  };
}
