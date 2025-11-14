import PropTypes from "prop-types";
import ZoomButton from "./ZoomButton.jsx";
import styles from "../AvatarEditorModal.module.css";

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

EditorZoomControls.propTypes = {
  zoomInLabel: PropTypes.string.isRequired,
  zoomOutLabel: PropTypes.string.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
  isZoomInDisabled: PropTypes.bool.isRequired,
  isZoomOutDisabled: PropTypes.bool.isRequired,
};

export default EditorZoomControls;
