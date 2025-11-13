import PropTypes from "prop-types";
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
      <button
        type="button"
        className={styles["zoom-button"]}
        onClick={onZoomOut}
        disabled={isZoomOutDisabled}
        aria-label={zoomOutLabel}
      >
        −
      </button>
      <button
        type="button"
        className={styles["zoom-button"]}
        onClick={onZoomIn}
        disabled={isZoomInDisabled}
        aria-label={zoomInLabel}
      >
        +
      </button>
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
