import PropTypes from "prop-types";

function ActiveSectionRenderer({ activeSection, headingId, descriptionId }) {
  const SectionComponent = activeSection?.Component;
  if (!SectionComponent) {
    return null;
  }
  return (
    <SectionComponent
      headingId={headingId}
      descriptionId={descriptionId}
      {...activeSection.componentProps}
    />
  );
}

ActiveSectionRenderer.propTypes = {
  activeSection: PropTypes.shape({
    Component: PropTypes.elementType.isRequired,
    componentProps: PropTypes.shape({}),
  }),
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
};

ActiveSectionRenderer.defaultProps = {
  activeSection: undefined,
  descriptionId: undefined,
};

export default ActiveSectionRenderer;
