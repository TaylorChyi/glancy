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
