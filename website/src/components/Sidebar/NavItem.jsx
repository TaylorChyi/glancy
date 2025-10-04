import { forwardRef, useMemo } from "react";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./NavItem.module.css";

// 使用策略模式在运行时挑选交互风格，避免在组件内部散落条件判断并便于未来扩展更多变体。
const INTERACTION_VARIANTS = {
  accent: {
    baseClass: "",
    activeClass: styles.active,
  },
  flat: {
    baseClass: styles.flat,
    activeClass: styles["flat-active"],
  },
};

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
    variant = "accent",
    allowMultilineLabel = false,
    ...rest
  },
  ref,
) {
  const variantStyles =
    INTERACTION_VARIANTS[variant] || INTERACTION_VARIANTS.accent;
  const baseVariantClass = variantStyles.baseClass;
  const activeVariantClass = variantStyles.activeClass;
  // 通过可选的多行模式将视觉策略与业务容器解耦，避免在组件内部引入长度判断逻辑。
  const multilineItemClass = allowMultilineLabel
    ? styles["item-multiline"]
    : "";
  const labelClassName = useMemo(
    () =>
      joinClassNames(
        styles.label,
        allowMultilineLabel ? styles["label-multiline"] : "",
      ),
    [allowMultilineLabel],
  );

  const content = (
    <>
      {renderIcon(icon, typeof label === "string" ? label : undefined)}
      <span className={labelClassName}>
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
        multilineItemClass,
        toneClassName,
        baseVariantClass,
        active ? activeVariantClass : "",
        className,
      ),
    [
      active,
      baseVariantClass,
      activeVariantClass,
      className,
      multilineItemClass,
      toneClassName,
    ],
  );

  if (to) {
    return (
      <NavLink
        ref={ref}
        to={to}
        className={({ isActive }) =>
          joinClassNames(
            styles.item,
            multilineItemClass,
            toneClassName,
            baseVariantClass,
            isActive || active ? activeVariantClass : "",
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
  variant: PropTypes.oneOf(Object.keys(INTERACTION_VARIANTS)),
  allowMultilineLabel: PropTypes.bool,
};

export default NavItem;
