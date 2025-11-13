import { forwardRef } from "react";
import PropTypes from "prop-types";
import NavItemView from "./NavItemView.jsx";
import { useNavItemModel } from "./useNavItemModel.ts";

const NavItem = forwardRef(function NavItem(props, ref) {
  const { viewProps } = useNavItemModel(props);
  return <NavItemView ref={ref} {...viewProps} />;
});

NavItem.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  label: PropTypes.node.isRequired,
  description: PropTypes.node,
  active: PropTypes.bool,
  to: PropTypes.string,
  href: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  children: PropTypes.node,
  tone: PropTypes.oneOf(["default", "muted"]),
  variant: PropTypes.oneOf(["accent", "flat"]),
  allowMultilineLabel: PropTypes.bool,
};

NavItem.defaultProps = {
  icon: undefined,
  description: undefined,
  active: false,
  to: undefined,
  href: undefined,
  className: "",
  onClick: undefined,
  type: "button",
  children: null,
  tone: "default",
  variant: "accent",
  allowMultilineLabel: false,
};

export default NavItem;
