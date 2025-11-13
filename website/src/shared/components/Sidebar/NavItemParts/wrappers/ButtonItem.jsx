import { forwardRef } from "react";
import PropTypes from "prop-types";

const ButtonItem = forwardRef(function ButtonItem(
  { classNames, handlers, link, restProps = {}, children },
  ref,
) {
  return (
    <button
      ref={ref}
      type={link.type ?? "button"}
      className={classNames.base}
      aria-current={handlers.ariaCurrent}
      onClick={handlers.onClick}
      {...restProps}
    >
      {children}
    </button>
  );
});

ButtonItem.propTypes = {
  classNames: PropTypes.shape({
    base: PropTypes.string.isRequired,
  }).isRequired,
  handlers: PropTypes.shape({
    onClick: PropTypes.func,
    ariaCurrent: PropTypes.string,
  }).isRequired,
  link: PropTypes.shape({
    type: PropTypes.oneOf(["button", "submit", "reset"]),
  }).isRequired,
  restProps: PropTypes.shape({}),
  children: PropTypes.node.isRequired,
};

ButtonItem.defaultProps = {
  restProps: undefined,
};

export default ButtonItem;
