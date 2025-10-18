/**
 * 背景：
 *  - 摘要按钮既要承担交互，又要注入断行，耦合在 section 文件中影响可读性。
 * 目的：
 *  - 将摘要按钮拆分成独立组件，聚焦在结构与可访问性语义。
 * 关键决策与取舍：
 *  - 继续通过注入器在渲染时处理零宽断行；
 *  - 维持 aria 语义，保障键盘与读屏体验。
 * 影响范围：
 *  - 折叠组件的摘要渲染逻辑。
 */
import { useMemo } from "react";
import PropTypes from "prop-types";

import styles from "../MarkdownRenderer.module.css";

export default function CollapsibleSummary({
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
      <span className={styles.chevron} aria-hidden="true">
        <span
          className={styles["chevron-icon"]}
          data-open={isOpen ? "true" : "false"}
        />
      </span>
      <span
        className={styles["summary-title"]}
        role="heading"
        aria-level={depth}
      >
        {renderedChildren}
      </span>
    </button>
  );
}

CollapsibleSummary.propTypes = {
  children: PropTypes.node.isRequired,
  contentId: PropTypes.string.isRequired,
  depth: PropTypes.number.isRequired,
  injectBreaks: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  labelId: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired,
};
