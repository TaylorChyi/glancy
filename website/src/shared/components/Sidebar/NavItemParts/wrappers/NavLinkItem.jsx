import { forwardRef } from "react";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";

const NavLinkItem = forwardRef(function NavLinkItem(
  { classNames, handlers, link, restProps = {}, children },
  ref,
) {
  return (
    <NavLink
      ref={ref}
      to={link.to}
      className={({ isActive }) => classNames.navLink(isActive)}
      aria-current={handlers.ariaCurrent}
      onClick={handlers.onClick}
      {...restProps}
    >
      {children}
    </NavLink>
  );
});

NavLinkItem.propTypes = {
  classNames: PropTypes.shape({
    navLink: PropTypes.func.isRequired,
  }).isRequired,
  handlers: PropTypes.shape({
    onClick: PropTypes.func,
    ariaCurrent: PropTypes.string,
  }).isRequired,
  link: PropTypes.shape({
    to: PropTypes.string.isRequired,
  }).isRequired,
  restProps: PropTypes.shape({}),
  children: PropTypes.node.isRequired,
};

NavLinkItem.defaultProps = {
  restProps: undefined,
};

export default NavLinkItem;
