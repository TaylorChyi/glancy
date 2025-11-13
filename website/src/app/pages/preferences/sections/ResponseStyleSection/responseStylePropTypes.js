import PropTypes from "prop-types";

export const placeholderPropType = PropTypes.shape({
  visible: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
});

export const errorPropType = PropTypes.shape({
  visible: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  retryLabel: PropTypes.string.isRequired,
  onRetry: PropTypes.oneOfType([PropTypes.func, PropTypes.oneOf([null])]),
});

export const optionPropType = PropTypes.shape({
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
});

export const dropdownPropType = PropTypes.shape({
  selectId: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(optionPropType).isRequired,
  value: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  isSaving: PropTypes.bool.isRequired,
});

export const fieldPropType = PropTypes.shape({
  inputId: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  isSaving: PropTypes.bool.isRequired,
});

