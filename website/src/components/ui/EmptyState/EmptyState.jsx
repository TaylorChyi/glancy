import PropTypes from "prop-types";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./EmptyState.module.css";

const SIZE_CLASS_MAP = {
  sm: styles["size-sm"],
  md: styles["size-md"],
  lg: styles["size-lg"],
};

function EmptyState({
  iconName,
  illustration,
  title,
  description,
  actions,
  className = "",
  size = "md",
}) {
  const sizeClass = SIZE_CLASS_MAP[size] || SIZE_CLASS_MAP.md;
  const hasVisual = Boolean(illustration || iconName);

  return (
    <section
      className={[styles.wrapper, sizeClass, className]
        .filter(Boolean)
        .join(" ")}
    >
      {hasVisual ? (
        <div className={styles.illustration} aria-hidden="true">
          {illustration || (
            <ThemeIcon name={iconName} alt="" className={styles.icon} />
          )}
        </div>
      ) : null}
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      {description ? <p className={styles.description}>{description}</p> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </section>
  );
}

EmptyState.propTypes = {
  iconName: PropTypes.string,
  illustration: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  actions: PropTypes.node,
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
};

export default EmptyState;
