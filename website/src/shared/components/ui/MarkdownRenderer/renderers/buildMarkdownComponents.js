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
import { createElement } from "react";
import PropTypes from "prop-types";

import CollapsibleSection from "./CollapsibleSection.jsx";
import CollapsibleBody from "./CollapsibleBody.jsx";
import createSummaryRenderer from "./createSummaryRenderer.js";
import styles from "../MarkdownRenderer.module.css";
import joinClassNames from "../utils/joinClassNames.js";

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

const TABLE_TAG_CLASS_MAP = {
  /**
   * 背景：Markdown 表格默认沿用 th 的浏览器样式，项目主题需要自定义排版与比重。
   * 目的：在不破坏断行逻辑的前提下，赋予表头/单元格专属类名，便于样式模块控制对齐与字重。
   * 取舍：采用 CSS Module 类映射，替代在组件中硬编码 style/align 属性，保持设计令牌集中治理。
   */
  th: styles["table-header-cell"],
  td: styles["table-data-cell"],
};

export default function buildMarkdownComponents({ injectBreaks }) {
  const components = Object.fromEntries(
    BREAKABLE_TAGS.map((tag) => {
      const BreakableElement = function BreakableElement({
        children,
        ...elementProps
      }) {
        const Tag = tag;
        const { className, ...restElementProps } = elementProps;
        const resolvedClassName = joinClassNames(
          className,
          TABLE_TAG_CLASS_MAP[tag],
        );
        return createElement(
          Tag,
          {
            ...restElementProps,
            className: resolvedClassName,
          },
          injectBreaks(children),
        );
      };

      BreakableElement.propTypes = {
        children: PropTypes.node,
      };

      return [tag, BreakableElement];
    }),
  );

  return {
    ...components,
    table: TableRenderer,
    "collapsible-section": (props) =>
      createElement(CollapsibleSection, {
        ...props,
        injectBreaks,
      }),
    "collapsible-summary": createSummaryRenderer(injectBreaks),
    "collapsible-body": CollapsibleBody,
  };
}

function TableRenderer({ children, className, ...tableProps }) {
  const resolvedClassName = joinClassNames(styles.table, className);
  return createElement(
    "table",
    {
      ...tableProps,
      className: resolvedClassName,
    },
    children,
  );
}

TableRenderer.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};
