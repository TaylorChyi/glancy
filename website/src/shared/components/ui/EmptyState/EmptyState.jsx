import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon";
import styles from "./EmptyState.module.css";

const SIZE_CLASS_MAP = {
  sm: styles["size-sm"],
  md: styles["size-md"],
  lg: styles["size-lg"],
};

// 通过“tone → className”映射构建轻量策略表，确保新增视觉语态时无需修改渲染分支。
const TONE_CLASS_MAP = Object.freeze({
  decorated: styles["tone-decorated"],
  plain: styles["tone-plain"],
});

const EmptyStateVisual = ({ illustration, iconName }) => (
  <div className={styles.illustration} aria-hidden="true">
    {illustration || (
      <ThemeIcon
        name={iconName}
        alt=""
        className={styles.icon}
        decorative
      />
    )}
  </div>
);

function EmptyState({
  iconName,
  illustration,
  title,
  description,
  actions,
  className = "",
  size = "md",
  tone = "decorated",
}) {
  const sizeClass = SIZE_CLASS_MAP[size] || SIZE_CLASS_MAP.md;
  const toneClass = TONE_CLASS_MAP[tone] || TONE_CLASS_MAP.decorated;
  const shouldRenderVisual =
    tone !== "plain" && (illustration || iconName);

  return (
    <section
      className={[styles.wrapper, sizeClass, toneClass, className]
        .filter(Boolean)
        .join(" ")}
    >
      {shouldRenderVisual && (
        <EmptyStateVisual illustration={illustration} iconName={iconName} />
      )}
      {title && <h2 className={styles.title}>{title}</h2>}
      {description && <p className={styles.description}>{description}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
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
  tone: PropTypes.oneOf(["decorated", "plain"]),
};

export default EmptyState;
