import { useId, useMemo } from "react";
import PropTypes from "prop-types";

const sanitizeId = (id) => id?.replaceAll(":", "-");

const isRenderable = (value) =>
  value !== null && value !== undefined && value !== "";

function SettingsSection({
  headingId,
  title,
  description,
  descriptionId,
  describedBy,
  showDivider = true,
  classes = {},
  children,
  ...sectionProps
}) {
  const autoDescriptionId = useId();
  const shouldRenderDescription = isRenderable(description);

  const resolvedDescriptionId = useMemo(() => {
    if (!shouldRenderDescription) {
      return undefined;
    }
    const candidateId =
      descriptionId ?? `${headingId}-${sanitizeId(autoDescriptionId)}`;
    return sanitizeId(candidateId);
  }, [autoDescriptionId, descriptionId, headingId, shouldRenderDescription]);

  const {
    section: sectionClassName,
    header: headerClassName,
    title: titleClassName,
    divider: dividerClassName,
    description: descriptionClassName,
  } = classes;

  const { "aria-describedby": ariaDescribedByFromProps, ...restSectionProps } =
    sectionProps;
  const ariaDescribedBy =
    describedBy ??
    ariaDescribedByFromProps ??
    (shouldRenderDescription ? resolvedDescriptionId : undefined);

  return (
    <section
      aria-labelledby={headingId}
      {...restSectionProps}
      className={sectionClassName}
      aria-describedby={ariaDescribedBy}
    >
      <div className={headerClassName}>
        <h3 id={headingId} className={titleClassName} tabIndex={-1}>
          {title}
        </h3>
        {showDivider ? (
          <div className={dividerClassName} aria-hidden="true" />
        ) : null}
      </div>
      {shouldRenderDescription ? (
        <p id={resolvedDescriptionId} className={descriptionClassName}>
          {description}
        </p>
      ) : null}
      {children}
    </section>
  );
}

SettingsSection.propTypes = {
  headingId: PropTypes.string.isRequired,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  descriptionId: PropTypes.string,
  describedBy: PropTypes.string,
  showDivider: PropTypes.bool,
  classes: PropTypes.shape({
    section: PropTypes.string,
    header: PropTypes.string,
    title: PropTypes.string,
    divider: PropTypes.string,
    description: PropTypes.string,
  }),
  children: PropTypes.node.isRequired,
};

export default SettingsSection;
