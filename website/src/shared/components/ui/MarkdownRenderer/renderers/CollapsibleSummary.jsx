import { useMemo } from "react";
import PropTypes from "prop-types";
import styles from "../MarkdownRenderer.module.css";

const SummaryButton = ({
  children,
  depth,
  isOpen,
  onToggle,
  labelId,
  contentId,
}) => (
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
    <span className={styles["summary-title"]} role="heading" aria-level={depth}>
      {children}
    </span>
  </button>
);

const CollapsibleSummary = ({
  children,
  depth,
  isOpen,
  onToggle,
  labelId,
  contentId,
  injectBreaks,
}) => {
  const renderedChildren = useMemo(
    () => (injectBreaks ? injectBreaks(children) : children),
    [children, injectBreaks],
  );
  return (
    <SummaryButton
      depth={depth}
      isOpen={isOpen}
      onToggle={onToggle}
      labelId={labelId}
      contentId={contentId}
    >
      {renderedChildren}
    </SummaryButton>
  );
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

export default CollapsibleSummary;
