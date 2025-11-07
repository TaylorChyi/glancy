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
