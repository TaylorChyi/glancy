import PropTypes from "prop-types";

import styles from "../MarkdownRenderer.module.css";
import joinClassNames from "../utils/joinClassNames.js";

const MARKDOWN_SPECIFIC_KEYS = ["remarkPlugins", "rehypePlugins", "components"];

export default function PlainMarkdownRenderer({
  children,
  className,
  ...rawProps
}) {
  const domProps = sanitizePlainRendererProps(rawProps);

  if (!children) {
    return null;
  }

  const resolvedClassName = joinClassNames(styles.plain, className);
  return (
    <div {...domProps} className={resolvedClassName}>
      {children}
    </div>
  );
}

PlainMarkdownRenderer.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

function sanitizePlainRendererProps(sourceProps) {
  if (!sourceProps) {
    return {};
  }

  const sanitized = { ...sourceProps };
  MARKDOWN_SPECIFIC_KEYS.forEach((key) => {
    delete sanitized[key];
  });
  return sanitized;
}
