import { Fragment, useMemo } from "react";
import PropTypes from "prop-types";

/**
 * Renders text across multiple lines by converting newline characters
 * into explicit <br /> elements. Intended for dynamic content where
 * newline preservation is required for readability.
 *
 * @param {object} props
 * @param {string} props.text - The text potentially containing newline characters.
 * @param {React.ElementType} [props.as='span'] - The HTML tag or component to render as the container.
 * @param {string} [props.className] - Optional class name for styling the container.
 */
const sanitizeLineKey = (line) =>
  line
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32) || "line";

export default function MultiLineText({ text = "", as = "span", className }) {
  const lineEntries = useMemo(() => {
    const rawLines = String(text).split(/\r?\n/);
    const occurrences = new Map();

    return rawLines.map((line) => {
      const baseKey = sanitizeLineKey(line);
      const count = occurrences.get(baseKey) ?? 0;
      occurrences.set(baseKey, count + 1);

      return {
        key: count === 0 ? baseKey : `${baseKey}-${count}`,
        content: line,
      };
    });
  }, [text]);

  const Element = as;
  return (
    <Element className={className}>
      {lineEntries.map(({ key, content }, index) => (
        <Fragment key={key}>
          {content}
          {index < lineEntries.length - 1 && <br />}
        </Fragment>
      ))}
    </Element>
  );
}

MultiLineText.propTypes = {
  text: PropTypes.string,
  as: PropTypes.elementType,
  className: PropTypes.string,
};
