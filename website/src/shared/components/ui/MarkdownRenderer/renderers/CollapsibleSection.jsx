/**
 * 背景：
 *  - Section 组件需要协调摘要与正文，却不应承担其渲染细节。
 * 目的：
 *  - 将状态管理与子节点委派隔离，保持 Section 职责聚焦在可访问性结构。
 * 关键决策与取舍：
 *  - 通过 SUMMARY_RENDERER_FLAG 判断外部注入的摘要渲染器；
 *  - 仅在内部维护展开状态，保证外部渲染器可复用。
 * 影响范围：
 *  - Markdown 折叠区块的装配逻辑。
 */
import { Children, cloneElement, useId, useState } from "react";
import PropTypes from "prop-types";

import styles from "../MarkdownRenderer.module.css";
import CollapsibleBody from "./CollapsibleBody.jsx";
import CollapsibleSummary from "./CollapsibleSummary.jsx";
import SUMMARY_RENDERER_FLAG from "../constants/summaryRendererFlag.js";

export default function CollapsibleSection({
  children,
  depth = 2,
  injectBreaks,
}) {
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

CollapsibleSection.propTypes = {
  children: PropTypes.node.isRequired,
  depth: PropTypes.number,
  injectBreaks: PropTypes.func.isRequired,
};
