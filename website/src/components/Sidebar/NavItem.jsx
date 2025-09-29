import { forwardRef, useMemo } from "react";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./NavItem.module.css";

const joinClassNames = (...tokens) => tokens.filter(Boolean).join(" ");

function renderIcon(icon, label) {
  if (!icon) return null;
  if (typeof icon !== "string") {
    return <span className={styles.icon}>{icon}</span>;
  }
  return (
    <span className={styles.icon} aria-hidden="true">
      <ThemeIcon name={icon} alt={label} width={18} height={18} />
    </span>
  );
}

const NavItem = forwardRef(function NavItem(
  {
    icon,
    label,
    description,
    active = false,
    to,
    href,
    className,
    tone = "default",
    onClick,
    type = "button",
    children = null,
    ...rest
  },
  ref,
) {
  const content = (
    <>
      {renderIcon(icon, typeof label === "string" ? label : undefined)}
      <span className={styles.label}>
        {label}
        {description ? (
          <span className={styles.description}>{description}</span>
        ) : null}
      </span>
      {children}
    </>
  );

  const toneClassName = tone === "muted" ? styles.muted : "";
  const resolvedClassName = useMemo(
    () =>
      joinClassNames(
        styles.item,
        toneClassName,
        active ? styles.active : "",
        className,
      ),
    [active, className, toneClassName],
  );

  if (to) {
    return (
      <NavLink
        ref={ref}
        to={to}
        className={({ isActive }) =>
          joinClassNames(
            styles.item,
            toneClassName,
            isActive || active ? styles.active : "",
            className,
          )
        }
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        {...rest}
      >
        {content}
      </NavLink>
    );
  }

  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        className={resolvedClassName}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={resolvedClassName}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      {...rest}
    >
      {content}
    </button>
  );
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
};

export default NavItem;
