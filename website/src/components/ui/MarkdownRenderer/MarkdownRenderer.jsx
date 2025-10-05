/**
 * 背景：
 *  - 现有 Markdown 渲染只关注折叠语义，长文本在 flex 容器内无法自然换行，
 *    在多语言内容（中日韩/英文长词）场景下会溢出组件宽度。
 * 目的：
 *  - 通过渲染阶段在字符级别补充潜在换行点，解耦视图层与布局约束，保证任意语言都能随容器宽度折行。
 * 关键决策与取舍：
 *  - 采用 `Intl.Segmenter` 进行字素切分，保持对多语言的统一处理；放弃纯 CSS 调整，避免与现有设计令牌冲突。
 * 影响范围：
 *  - MarkdownRenderer 及其折叠子组件；ReactMarkdown 的文本节点将注入零宽空格作为可选断行点。
 * 演进与TODO：
 *  - 如未来需要根据语义（例如词语级）换行，可在 `createBreakInjector` 中扩展粒度策略。
 */
import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  useMemo,
  useState,
} from "react";
import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeCollapsibleSections from "./rehypeCollapsibleSections.js";
import styles from "./MarkdownRenderer.module.css";

const SUMMARY_RENDERER_FLAG = Symbol("CollapsibleSummaryRenderer");

/**
 * 通用 Markdown 渲染组件，支持 GFM 语法并为标题分区提供折叠交互。
 * 组件在渲染阶段通过 rehype 插件把指定层级以上的标题收拢为可展开的分节，
 * 以便在长释义场景下维持简洁的视觉秩序，同时保留锚点定位能力。
 */
function MarkdownRenderer({ children, ...props }) {
  const injectBreaks = useBreakableContent();
  const components = useMemo(
    () =>
      buildMarkdownComponents({
        injectBreaks,
      }),
    [injectBreaks],
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

function CollapsibleSection({ children, depth = 2, injectBreaks }) {
  const sectionId = useId();
  const [isOpen, setIsOpen] = useState(depth <= 2);
  const labelledBy = `${sectionId}-summary`;
  const contentId = `${sectionId}-content`;

  const items = Children.toArray(children);
  return (
    <section className={styles.section} data-depth={depth}>
      {items.map((child) => {
        const isSummary =
          child.type === CollapsibleSummary ||
          Boolean(child.type?.[SUMMARY_RENDERER_FLAG]);

        if (isSummary) {
          return cloneElement(child, {
            key: "summary",
            depth,
            isOpen,
            onToggle: () => setIsOpen((value) => !value),
            labelId: labelledBy,
            contentId,
            injectBreaks,
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
  injectBreaks,
}) {
  const renderedChildren = useMemo(
    () => (injectBreaks ? injectBreaks(children) : children),
    [children, injectBreaks],
  );

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
        {renderedChildren}
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

function useBreakableContent() {
  return useMemo(() => createBreakInjector(), []);
}

function createBreakInjector() {
  const ZERO_WIDTH_SPACE = "\u200B";
  const segmenter =
    typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
      : null;

  const splitText = (text) => {
    if (!text) return [];
    if (!segmenter) {
      return Array.from(text);
    }
    return Array.from(segmenter.segment(text), (segment) => segment.segment);
  };

  const processNode = (node, keyPrefix) => {
    if (typeof node === "string" || typeof node === "number") {
      const text = String(node);
      if (!text || text.includes(ZERO_WIDTH_SPACE)) {
        return text;
      }

      const segments = splitText(text);
      if (segments.length <= 1) {
        return text;
      }

      return segments.join(ZERO_WIDTH_SPACE);
    }

    if (isValidElement(node)) {
      const shouldSkip = typeof node.type === "string" && (node.type === "code" || node.type === "pre");
      if (shouldSkip || !node.props?.children) {
        return node;
      }

      const processedChildren = processChildren(
        node.props.children,
        `${keyPrefix}-child`,
      );
      return cloneElement(node, node.props, processedChildren);
    }

    return node;
  };

  const processChildren = (children, keyPrefix) =>
    Children.toArray(children).flatMap((child, index) =>
      processNode(child, `${keyPrefix}-${index}`),
    );

  return (children) => processChildren(children, "node");
}

function buildMarkdownComponents({ injectBreaks }) {
  const breakableTags = ["p", "li", "dd", "dt", "th", "td", "caption", "figcaption", "blockquote"];

  const components = Object.fromEntries(
    breakableTags.map((tag) => {
      const BreakableElement = function BreakableElement({ children, ...elementProps }) {
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

function createSummaryRenderer(injectBreaks) {
  const SummaryRenderer = function SummaryRenderer(props) {
    return <CollapsibleSummary {...props} injectBreaks={injectBreaks} />;
  };

  SummaryRenderer.propTypes = CollapsibleSummary.propTypes;
  SummaryRenderer[SUMMARY_RENDERER_FLAG] = true;

  return SummaryRenderer;
}

MarkdownRenderer.propTypes = {
  children: PropTypes.node,
};

CollapsibleSection.propTypes = {
  children: PropTypes.node.isRequired,
  depth: PropTypes.number,
  injectBreaks: PropTypes.func.isRequired,
};

CollapsibleSummary.propTypes = {
  children: PropTypes.node.isRequired,
  contentId: PropTypes.string.isRequired,
  depth: PropTypes.number.isRequired,
  injectBreaks: PropTypes.func.isRequired,
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
