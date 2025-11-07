import PropTypes from "prop-types";

import styles from "../MarkdownRenderer.module.css";

export default function CollapsibleBody({
  children,
  isOpen,
  contentId,
  labelId,
}) {
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

CollapsibleBody.propTypes = {
  children: PropTypes.node,
  contentId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  labelId: PropTypes.string.isRequired,
};
