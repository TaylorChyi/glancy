import PropTypes from "prop-types";

function MeasurementProbe({ measurement }) {
  const referenceMeasurement = measurement?.referenceMeasurement;
  if (!referenceMeasurement) {
    return null;
  }
  const { Component, props, registerNode } = referenceMeasurement;
  return (
    <div aria-hidden className={measurement.panelProbeClassName} ref={registerNode}>
      <Component {...props} />
    </div>
  );
}

MeasurementProbe.propTypes = {
  measurement: PropTypes.shape({
    referenceMeasurement: PropTypes.shape({
      Component: PropTypes.elementType.isRequired,
      props: PropTypes.shape({}),
      registerNode: PropTypes.func.isRequired,
    }),
    panelProbeClassName: PropTypes.string,
  }),
};

MeasurementProbe.defaultProps = {
  measurement: undefined,
};

export default MeasurementProbe;
