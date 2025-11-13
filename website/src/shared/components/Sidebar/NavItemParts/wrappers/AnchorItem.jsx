import { forwardRef } from "react";
import PropTypes from "prop-types";

const AnchorItem = forwardRef(function AnchorItem(
  { classNames, handlers, link, restProps = {}, children },
  ref,
) {
  return (
    <a
      ref={ref}
      href={link.href}
      className={classNames.base}
      aria-current={handlers.ariaCurrent}
      onClick={handlers.onClick}
      {...restProps}
    >
      {children}
    </a>
  );
});

AnchorItem.propTypes = {
  classNames: PropTypes.shape({
    base: PropTypes.string.isRequired,
  }).isRequired,
  handlers: PropTypes.shape({
    onClick: PropTypes.func,
    ariaCurrent: PropTypes.string,
  }).isRequired,
  link: PropTypes.shape({
    href: PropTypes.string.isRequired,
  }).isRequired,
  restProps: PropTypes.shape({}),
  children: PropTypes.node.isRequired,
};

AnchorItem.defaultProps = {
  restProps: undefined,
};

export default AnchorItem;
