import { forwardRef } from "react";
import PropTypes from "prop-types";
import NavItemContent from "./NavItemParts/NavItemContent.jsx";
import NavLinkItem from "./NavItemParts/wrappers/NavLinkItem.jsx";
import AnchorItem from "./NavItemParts/wrappers/AnchorItem.jsx";
import ButtonItem from "./NavItemParts/wrappers/ButtonItem.jsx";

const COMPONENT_MAP = {
  navlink: NavLinkItem,
  anchor: AnchorItem,
  button: ButtonItem,
};

const NavItemView = forwardRef(function NavItemView(
  { componentType, classNames, handlers, link, content, restProps },
  ref,
) {
  const Wrapper = COMPONENT_MAP[componentType] ?? ButtonItem;
  return (
    <Wrapper
      ref={ref}
      classNames={classNames}
      handlers={handlers}
      link={link}
      restProps={restProps}
    >
      <NavItemContent {...content} />
    </Wrapper>
  );
});

NavItemView.propTypes = {
  componentType: PropTypes.oneOf(["navlink", "anchor", "button"]).isRequired,
  classNames: PropTypes.shape({
    base: PropTypes.string.isRequired,
    navLink: PropTypes.func,
  }).isRequired,
  handlers: PropTypes.shape({
    onClick: PropTypes.func,
    ariaCurrent: PropTypes.string,
  }).isRequired,
  link: PropTypes.shape({
    to: PropTypes.string,
    href: PropTypes.string,
    type: PropTypes.oneOf(["button", "submit", "reset"]),
  }).isRequired,
  content: PropTypes.shape({
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    label: PropTypes.node.isRequired,
    description: PropTypes.node,
    labelClassName: PropTypes.string.isRequired,
    children: PropTypes.node,
  }).isRequired,
  restProps: PropTypes.shape({}),
};

NavItemView.defaultProps = {
  restProps: undefined,
};

export default NavItemView;
