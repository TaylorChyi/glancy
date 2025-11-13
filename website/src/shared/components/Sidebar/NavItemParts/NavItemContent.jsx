import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon";
import styles from "../NavItem.module.css";

const NavItemIcon = ({ icon, label }) => {
  if (!icon) {
    return null;
  }
  if (typeof icon !== "string") {
    return <span className={styles.icon}>{icon}</span>;
  }
  return (
    <span className={styles.icon} aria-hidden="true">
      <ThemeIcon
        name={icon}
        alt={label}
        width={18}
        height={18}
        roleClass="inherit"
      />
    </span>
  );
};

NavItemIcon.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  label: PropTypes.string,
};

NavItemIcon.defaultProps = {
  icon: undefined,
  label: undefined,
};

function NavItemContent({ icon, label, description, labelClassName, children }) {
  const accessibleLabel = typeof label === "string" ? label : undefined;
  return (
    <>
      <NavItemIcon icon={icon} label={accessibleLabel} />
      <span className={labelClassName}>
        {label}
        {description ? (
          <span className={styles.description}>{description}</span>
        ) : null}
      </span>
      {children}
    </>
  );
}

NavItemContent.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  label: PropTypes.node.isRequired,
  description: PropTypes.node,
  labelClassName: PropTypes.string.isRequired,
  children: PropTypes.node,
};

NavItemContent.defaultProps = {
  icon: undefined,
  description: undefined,
  children: null,
};

export default NavItemContent;
