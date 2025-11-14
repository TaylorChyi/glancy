import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon";

function PrimaryNavItem({ icon, iconAlt, label, onClick, isActive, title }) {
  return (
    <button
      type="button"
      className="primary-nav-item"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      title={title}
    >
      <span className="primary-nav-item-indicator" aria-hidden="true" />
      <span className="primary-nav-item-icon" aria-hidden="true">
        {icon ? (
          <ThemeIcon
            name={icon}
            alt={iconAlt || label}
            width={20}
            height={20}
            className="primary-nav-item-icon-asset"
            roleClass="inherit"
          />
        ) : null}
      </span>
      <span className="primary-nav-item-label">{label}</span>
    </button>
  );
}

PrimaryNavItem.propTypes = {
  icon: PropTypes.string,
  iconAlt: PropTypes.string,
  isActive: PropTypes.bool,
  label: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  title: PropTypes.string,
};

PrimaryNavItem.defaultProps = {
  icon: undefined,
  iconAlt: undefined,
  isActive: false,
  onClick: undefined,
  title: undefined,
};

function PrimaryNavList({ navItems, activeView, ariaLabel }) {
  return (
    <nav aria-label={ariaLabel}>
      <ul className="sidebar-primary-nav">
        {navItems.map((item) => {
          const isActive = item.enableActiveState && activeView === item.key;

          return (
            <li key={item.key}>
              <PrimaryNavItem
                icon={item.icon}
                iconAlt={item.iconAlt}
                label={item.label}
                onClick={item.onClick}
                isActive={isActive}
                title={item.title}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

PrimaryNavList.propTypes = {
  activeView: PropTypes.string,
  ariaLabel: PropTypes.string.isRequired,
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      enableActiveState: PropTypes.bool.isRequired,
      icon: PropTypes.string,
      iconAlt: PropTypes.string,
      key: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
      onClick: PropTypes.func,
      title: PropTypes.string,
    }).isRequired,
  ).isRequired,
};

PrimaryNavList.defaultProps = {
  activeView: undefined,
};

export default PrimaryNavList;
