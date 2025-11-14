import { useId, useMemo } from "react";
import PropTypes from "prop-types";

const sanitizeId = (id) => id?.replaceAll(":", "-");

const isRenderable = (value) =>
  value !== null && value !== undefined && value !== "";

const resolveAriaDescribedBy = ({
  describedBy,
  ariaDescribedByFromProps,
  shouldRenderDescription,
  resolvedDescriptionId,
}) =>
  describedBy ??
  ariaDescribedByFromProps ??
  (shouldRenderDescription ? resolvedDescriptionId : undefined);

const getSectionClasses = (classes = {}) => ({
  sectionClassName: classes.section,
  headerClassName: classes.header,
  titleClassName: classes.title,
  dividerClassName: classes.divider,
  descriptionClassName: classes.description,
});

const splitSectionProps = (sectionProps) => {
  const { "aria-describedby": ariaDescribedByFromProps, ...restSectionProps } =
    sectionProps;
  return { ariaDescribedByFromProps, restSectionProps };
};

const useResolvedDescriptionId = ({
  shouldRenderDescription,
  descriptionId,
  headingId,
  autoDescriptionId,
}) =>
  useMemo(() => {
    if (!shouldRenderDescription) {
      return undefined;
    }
    const candidateId =
      descriptionId ?? `${headingId}-${sanitizeId(autoDescriptionId)}`;
    return sanitizeId(candidateId);
  }, [autoDescriptionId, descriptionId, headingId, shouldRenderDescription]);

function SectionHeader({
  headingId,
  title,
  showDivider,
  headerClassName,
  titleClassName,
  dividerClassName,
}) {
  return (
    <div className={headerClassName}>
      <h3 id={headingId} className={titleClassName} tabIndex={-1}>
        {title}
      </h3>
      {showDivider ? (
        <div className={dividerClassName} aria-hidden="true" />
      ) : null}
    </div>
  );
}

function SectionDescription({
  shouldRender,
  id,
  className,
  children,
}) {
  if (!shouldRender) {
    return null;
  }

  return (
    <p id={id} className={className}>
      {children}
    </p>
  );
}

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
  const resolvedDescriptionId = useResolvedDescriptionId({
    shouldRenderDescription,
    descriptionId,
    headingId,
    autoDescriptionId,
  });
  const {
    sectionClassName,
    headerClassName,
    titleClassName,
    dividerClassName,
    descriptionClassName,
  } = getSectionClasses(classes);
  const { ariaDescribedByFromProps, restSectionProps } =
    splitSectionProps(sectionProps);
  const ariaDescribedBy = resolveAriaDescribedBy({
    describedBy,
    ariaDescribedByFromProps,
    shouldRenderDescription,
    resolvedDescriptionId,
  });
  const headerProps = {
    headingId,
    title,
    showDivider,
    headerClassName,
    titleClassName,
    dividerClassName,
  };
  const descriptionProps = {
    shouldRender: shouldRenderDescription,
    id: resolvedDescriptionId,
    className: descriptionClassName,
  };
  return (
    <section
      aria-labelledby={headingId}
      {...restSectionProps}
      className={sectionClassName}
      aria-describedby={ariaDescribedBy}
    >
      <SectionHeader {...headerProps} />
      <SectionDescription {...descriptionProps}>{description}</SectionDescription>
      {children}
    </section>
  );
}

SectionHeader.propTypes = {
  headingId: PropTypes.string.isRequired,
  title: PropTypes.node.isRequired,
  showDivider: PropTypes.bool.isRequired,
  headerClassName: PropTypes.string,
  titleClassName: PropTypes.string,
  dividerClassName: PropTypes.string,
};

SectionDescription.propTypes = {
  shouldRender: PropTypes.bool.isRequired,
  id: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};

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
