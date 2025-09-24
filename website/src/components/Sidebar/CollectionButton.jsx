import PropTypes from "prop-types";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./Sidebar.module.css";

const joinClassName = (...parts) => parts.filter(Boolean).join(" ");

function CollectionButton({ icon, label, iconAlt, isActive = false, onClick }) {
  const buttonClassName = joinClassName(
    styles["collection-button"],
    isActive ? styles["collection-button-active"] : "",
  );

  return (
    <button type="button" className={buttonClassName} onClick={onClick}>
      <ThemeIcon
        name={icon}
        alt={iconAlt || label}
        width={16}
        height={16}
        aria-hidden={iconAlt ? undefined : "true"}
        className={styles["collection-button-icon"]}
      />
      <span>{label}</span>
    </button>
  );
}

CollectionButton.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  iconAlt: PropTypes.string,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
};

CollectionButton.defaultProps = {
  iconAlt: undefined,
  isActive: false,
  onClick: undefined,
};

export default CollectionButton;
