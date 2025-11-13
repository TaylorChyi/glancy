import PropTypes from "prop-types";
import styles from "../AvatarEditorModal.module.css";
import EditorZoomControls from "./EditorZoomControls.jsx";
import EditorActionButtons from "./EditorActionButtons.jsx";

function EditorControls({ zoom, actions, labels }) {
  return (
    <div className={styles.controls}>
      <EditorZoomControls
        zoomInLabel={labels.zoomIn}
        zoomOutLabel={labels.zoomOut}
        onZoomIn={zoom.onZoomIn}
        onZoomOut={zoom.onZoomOut}
        isZoomInDisabled={zoom.isZoomInDisabled}
        isZoomOutDisabled={zoom.isZoomOutDisabled}
      />
      <EditorActionButtons
        onCancel={actions.onCancel}
        onConfirm={actions.onConfirm}
        isProcessing={actions.isProcessing}
        cancelLabel={labels.cancel}
        confirmLabel={labels.confirm}
      />
    </div>
  );
}

EditorControls.propTypes = {
  zoom: PropTypes.shape({
    onZoomIn: PropTypes.func.isRequired,
    onZoomOut: PropTypes.func.isRequired,
    isZoomInDisabled: PropTypes.bool.isRequired,
    isZoomOutDisabled: PropTypes.bool.isRequired,
  }).isRequired,
  actions: PropTypes.shape({
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    isProcessing: PropTypes.bool.isRequired,
  }).isRequired,
  labels: PropTypes.shape({
    zoomIn: PropTypes.string.isRequired,
    zoomOut: PropTypes.string.isRequired,
    cancel: PropTypes.string.isRequired,
    confirm: PropTypes.string.isRequired,
  }).isRequired,
};

export default EditorControls;
