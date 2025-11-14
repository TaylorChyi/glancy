import PropTypes from "prop-types";

export const keyboardShortcutItemPropType = PropTypes.shape({
  action: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  displayValue: PropTypes.string.isRequired,
  recordingLabel: PropTypes.string.isRequired,
  statusLabel: PropTypes.string.isRequired,
  errorMessage: PropTypes.string,
  hasError: PropTypes.bool.isRequired,
  isRecording: PropTypes.bool.isRequired,
  isSaving: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
  onCaptureStart: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
});

export const keyboardResetButtonPropType = PropTypes.shape({
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
});
