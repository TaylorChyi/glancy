import PropTypes from "prop-types";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./Sidebar.module.css";

const joinClassName = (...tokens) => tokens.filter(Boolean).join(" ");

function renderIcon(icon, alt, label) {
  if (!icon) return null;
  if (typeof icon !== "string") {
    return <span className={styles["sidebar-action-icon"]}>{icon}</span>;
  }

  return (
    <ThemeIcon
      name={icon}
      alt={alt || label}
      width={20}
      height={20}
      aria-hidden={alt ? undefined : "true"}
      className={styles["sidebar-action-icon"]}
    />
  );
}

function SidebarActionItem({
  as: Component = "button",
  type = "button",
  icon,
  iconAlt,
  label,
  description,
  badge,
  trailing,
  isActive = false,
  className,
  onClick,
  ...rest
}) {
  const composedClassName = joinClassName(
    styles["sidebar-action"],
    isActive ? styles["sidebar-action-active"] : "",
    className,
  );

  const content = (
    <>
      {renderIcon(icon, iconAlt, label)}
      <div className={styles["sidebar-action-body"]}>
        <span className={styles["sidebar-action-label"]}>
          {label}
          {badge ? (
            <span className={styles["sidebar-action-badge"]}>{badge}</span>
          ) : null}
        </span>
        {description ? (
          <span className={styles["sidebar-action-description"]}>
            {description}
          </span>
        ) : null}
      </div>
      {trailing ? (
        <span className={styles["sidebar-action-trailing"]}>{trailing}</span>
      ) : null}
    </>
  );

  if (Component === "button") {
    return (
      <button
        type={type}
        className={composedClassName}
        onClick={onClick}
        {...rest}
      >
        {content}
      </button>
    );
  }

  return (
    <Component className={composedClassName} onClick={onClick} {...rest}>
      {content}
    </Component>
  );
}

SidebarActionItem.propTypes = {
  as: PropTypes.elementType,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  iconAlt: PropTypes.string,
  label: PropTypes.node.isRequired,
  description: PropTypes.node,
  badge: PropTypes.node,
  trailing: PropTypes.node,
  isActive: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

SidebarActionItem.defaultProps = {
  as: "button",
  type: "button",
  icon: undefined,
  iconAlt: undefined,
  description: undefined,
  badge: undefined,
  trailing: undefined,
  isActive: false,
  className: undefined,
  onClick: undefined,
};

export default SidebarActionItem;
