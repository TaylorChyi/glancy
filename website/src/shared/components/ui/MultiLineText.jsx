import { Fragment } from "react";
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
export default function MultiLineText({ text = "", as = "span", className }) {
  const lines = String(text).split(/\r?\n/);
  const Element = as;
  return (
    <Element className={className}>
      {lines.map((line, index) => (
        <Fragment key={index}>
          {line}
          {index < lines.length - 1 && <br />}
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
