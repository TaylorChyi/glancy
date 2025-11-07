import PropTypes from "prop-types";
import NavItem from "../NavItem.jsx";
import styles from "../Sidebar.module.css";

function SidebarHeader({ items, ariaLabel }) {
  if (!items || items.length === 0) return null;

  return (
    <div className={styles.headerNav} role="navigation" aria-label={ariaLabel}>
      {items.map((item) => (
        <NavItem
          key={item.key}
          icon={item.icon}
          label={item.label}
          active={item.active}
          onClick={item.onClick}
          variant={item.variant || "flat"}
          data-testid={item.testId}
        />
      ))}
    </div>
  );
}

SidebarHeader.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      active: PropTypes.bool,
      onClick: PropTypes.func,
      testId: PropTypes.string,
    }),
  ),
  ariaLabel: PropTypes.string,
};

SidebarHeader.defaultProps = {
  items: [],
  ariaLabel: undefined,
};

export default SidebarHeader;
