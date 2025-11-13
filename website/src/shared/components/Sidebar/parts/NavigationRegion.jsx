import PropTypes from "prop-types";
import SidebarHeader from "../header/SidebarHeader.jsx";

function NavigationRegion({ items, ariaLabel }) {
  return <SidebarHeader items={items} ariaLabel={ariaLabel} />;
}

NavigationRegion.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  ariaLabel: PropTypes.string,
};

NavigationRegion.defaultProps = {
  ariaLabel: undefined,
};

export default NavigationRegion;
