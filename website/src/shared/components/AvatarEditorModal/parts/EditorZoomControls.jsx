import PropTypes from "prop-types";
import styles from "../AvatarEditorModal.module.css";

function ZoomButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      className={styles["zoom-button"]}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function EditorZoomControls({
  zoomInLabel,
  zoomOutLabel,
  onZoomIn,
  onZoomOut,
  isZoomInDisabled,
  isZoomOutDisabled,
}) {
  return (
    <div className={styles["zoom-controls"]}>
      <ZoomButton
        label={zoomOutLabel}
        onClick={onZoomOut}
        disabled={isZoomOutDisabled}
      >
        −
      </ZoomButton>
      <ZoomButton label={zoomInLabel} onClick={onZoomIn} disabled={isZoomInDisabled}>
        +
      </ZoomButton>
    </div>
  );
}

ZoomButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

EditorZoomControls.propTypes = {
  zoomInLabel: PropTypes.string.isRequired,
  zoomOutLabel: PropTypes.string.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
  isZoomInDisabled: PropTypes.bool.isRequired,
  isZoomOutDisabled: PropTypes.bool.isRequired,
};

export default EditorZoomControls;
