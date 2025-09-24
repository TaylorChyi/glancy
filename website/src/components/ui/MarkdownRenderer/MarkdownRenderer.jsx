import { Children, cloneElement, useId, useMemo, useState } from "react";
import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeCollapsibleSections from "./rehypeCollapsibleSections.js";
import styles from "./MarkdownRenderer.module.css";

/**
 * 通用 Markdown 渲染组件，支持 GFM 语法并为标题分区提供折叠交互。
 * 组件在渲染阶段通过 rehype 插件把指定层级以上的标题收拢为可展开的分节，
 * 以便在长释义场景下维持简洁的视觉秩序，同时保留锚点定位能力。
 */
function MarkdownRenderer({ children, ...props }) {
  const components = useMemo(
    () => ({
      "collapsible-section": CollapsibleSection,
      "collapsible-summary": CollapsibleSummary,
      "collapsible-body": CollapsibleBody,
    }),
    [],
  );

  if (!children) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeCollapsibleSections]}
      components={components}
      {...props}
    >
      {children}
    </ReactMarkdown>
  );
}

function CollapsibleSection({ children, depth = 2 }) {
  const sectionId = useId();
  const [isOpen, setIsOpen] = useState(depth <= 2);
  const labelledBy = `${sectionId}-summary`;
  const contentId = `${sectionId}-content`;

  const items = Children.toArray(children);
  return (
    <section className={styles.section} data-depth={depth}>
      {items.map((child) => {
        if (child.type === CollapsibleSummary) {
          return cloneElement(child, {
            key: "summary",
            depth,
            isOpen,
            onToggle: () => setIsOpen((value) => !value),
            labelId: labelledBy,
            contentId,
          });
        }
        if (child.type === CollapsibleBody) {
          return cloneElement(child, {
            key: "body",
            isOpen,
            contentId,
            labelId: labelledBy,
          });
        }
        return child;
      })}
    </section>
  );
}

function CollapsibleSummary({
  children,
  depth,
  isOpen,
  onToggle,
  labelId,
  contentId,
}) {
  return (
    <button
      type="button"
      id={labelId}
      className={styles.summary}
      aria-expanded={isOpen}
      aria-controls={contentId}
      onClick={onToggle}
    >
      <span
        className={styles["summary-title"]}
        role="heading"
        aria-level={depth}
      >
        {children}
      </span>
      <span className={styles.chevron} aria-hidden="true">
        <span
          className={styles["chevron-icon"]}
          data-open={isOpen ? "true" : "false"}
        />
      </span>
    </button>
  );
}

function CollapsibleBody({ children, isOpen, contentId, labelId }) {
  return (
    <div
      id={contentId}
      role="region"
      aria-labelledby={labelId}
      className={styles.body}
      data-open={isOpen ? "true" : "false"}
    >
      <div className={styles["body-inner"]}>{children}</div>
    </div>
  );
}

MarkdownRenderer.propTypes = {
  children: PropTypes.node,
};

CollapsibleSection.propTypes = {
  children: PropTypes.node.isRequired,
  depth: PropTypes.number,
};

CollapsibleSummary.propTypes = {
  children: PropTypes.node.isRequired,
  contentId: PropTypes.string.isRequired,
  depth: PropTypes.number.isRequired,
  isOpen: PropTypes.bool.isRequired,
  labelId: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired,
};

CollapsibleBody.propTypes = {
  children: PropTypes.node,
  contentId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  labelId: PropTypes.string.isRequired,
};

export default MarkdownRenderer;
