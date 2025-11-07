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
