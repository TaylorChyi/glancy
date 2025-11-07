import PropTypes from "prop-types";
import NavItem from "../NavItem.jsx";
import styles from "../UserDock.module.css";

function AnonymousDock({ loginNav, registerNav }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.anonymous}>
        <NavItem icon={loginNav.icon} label={loginNav.label} to={loginNav.to} />
        <NavItem
          icon={registerNav.icon}
          label={registerNav.label}
          to={registerNav.to}
        />
      </div>
    </div>
  );
}

AnonymousDock.propTypes = {
  loginNav: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
  }).isRequired,
  registerNav: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
  }).isRequired,
};

export default AnonymousDock;
