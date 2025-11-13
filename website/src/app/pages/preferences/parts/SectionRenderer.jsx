import PropTypes from "prop-types";

function SectionRenderer({ section }) {
  if (!section) {
    return null;
  }
  const SectionComponent = section.Component;
  return <SectionComponent {...section.props} />;
}

SectionRenderer.propTypes = {
  section: PropTypes.shape({
    Component: PropTypes.elementType.isRequired,
    props: PropTypes.shape({}),
  }),
};

SectionRenderer.defaultProps = {
  section: undefined,
};

export default SectionRenderer;
