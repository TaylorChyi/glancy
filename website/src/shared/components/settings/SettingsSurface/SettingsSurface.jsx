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

const useSettingsSurfaceIds = ({
  description,
  providedHeadingId,
  providedDescriptionId,
}) => {
  const generatedHeadingId = useId();
  const generatedDescriptionId = useId();

  return {
    headingId: providedHeadingId ?? generatedHeadingId,
    descriptionId: description
      ? providedDescriptionId ?? generatedDescriptionId
      : undefined,
  };
};

const useSettingsSurfaceData = ({
  description,
  variant = SETTINGS_SURFACE_VARIANTS.MODAL,
  onSubmit,
  as,
  className = "",
  headingId: providedHeadingId,
  descriptionId: providedDescriptionId,
  renderHeader,
  title,
}) => {
  const { headingId, descriptionId } = useSettingsSurfaceIds({
    description,
    providedHeadingId,
    providedDescriptionId,
  });
  const Component = as ?? (onSubmit ? "form" : "section");

  return {
    Component,
    composedClassName: composeSurfaceClassName(variant, className),
    headerContent: resolveHeaderContent(renderHeader, {
      headingId,
      descriptionId,
      title,
      description,
    }),
    headingId,
    descriptionId,
  };
};

const SettingsSurface = forwardRef(function SettingsSurface(props, ref) {
  const { actions, children, onSubmit } = props;
  const {
    Component,
    composedClassName,
    headerContent,
    headingId,
    descriptionId,
  } = useSettingsSurfaceData(props);

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
