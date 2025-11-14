import PropTypes from "prop-types";

export const optionPropType = PropTypes.shape({
  value: PropTypes.string.isRequired,
  badge: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
});

export const refPropType = PropTypes.shape({ current: PropTypes.instanceOf(Element) });
