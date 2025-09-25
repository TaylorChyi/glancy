import { forwardRef, useId } from "react";
import PropTypes from "prop-types";
import styles from "./SettingsSurface.module.css";
import { SETTINGS_SURFACE_VARIANTS } from "./constants.js";

const variantClassName = {
  [SETTINGS_SURFACE_VARIANTS.MODAL]: styles["surface-modal"],
  [SETTINGS_SURFACE_VARIANTS.PAGE]: styles["surface-page"],
};

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
  const resolvedVariantClassName = variantClassName[variant] ?? "";
  const composedClassName = [
    styles.surface,
    resolvedVariantClassName,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component
      ref={ref}
      className={composedClassName}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onSubmit={onSubmit}
    >
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
};

export default SettingsSurface;
