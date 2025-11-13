import { forwardRef, useId } from "react";
import PropTypes from "prop-types";
import styles from "./SettingsSurface.module.css";
import { SETTINGS_SURFACE_VARIANTS } from "./constants.js";

const variantClassName = {
  [SETTINGS_SURFACE_VARIANTS.MODAL]: styles["surface-modal"],
  [SETTINGS_SURFACE_VARIANTS.PAGE]: styles["surface-page"],
};

const renderDefaultHeader = ({ headingId, descriptionId, title, description }) => (
  <header className={styles.header}>
    <h2 id={headingId} className={styles.title}>
      {title}
    </h2>
    {description ? (
      <p id={descriptionId} className={styles.description}>
        {description}
      </p>
    ) : null}
  </header>
);

const resolveHeaderContent = (renderHeader, context) =>
  typeof renderHeader === "function"
    ? renderHeader(context)
    : renderDefaultHeader(context);

const composeSurfaceClassName = (variant, className) =>
  [styles.surface, variantClassName[variant] ?? "", className]
    .filter(Boolean)
    .join(" ");

const SettingsSurface = forwardRef(function SettingsSurface(
  {
    title,
    description,
    actions,
    children,
    variant = SETTINGS_SURFACE_VARIANTS.MODAL,
    onSubmit,
    headingId: providedHeadingId,
    descriptionId: providedDescriptionId,
    as,
    className = "",
    renderHeader,
  },
  ref,
) {
  const generatedHeadingId = useId();
  const generatedDescriptionId = useId();

  const headingId = providedHeadingId ?? generatedHeadingId;
  const descriptionId = description
    ? (providedDescriptionId ?? generatedDescriptionId)
    : undefined;

  const Component = as ?? (onSubmit ? "form" : "section");
  const composedClassName = composeSurfaceClassName(variant, className);
  const headerContent = resolveHeaderContent(renderHeader, {
    headingId,
    descriptionId,
    title,
    description,
  });

  return (
    <Component
      ref={ref}
      className={composedClassName}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onSubmit={onSubmit}
    >
      {headerContent}
      <div className={styles.content}>{children}</div>
      {actions ? <footer className={styles.actions}>{actions}</footer> : null}
    </Component>
  );
});

SettingsSurface.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actions: PropTypes.node,
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(Object.values(SETTINGS_SURFACE_VARIANTS)),
  onSubmit: PropTypes.func,
  headingId: PropTypes.string,
  descriptionId: PropTypes.string,
  as: PropTypes.elementType,
  className: PropTypes.string,
  renderHeader: PropTypes.func,
};

export default SettingsSurface;
