import PropTypes from "prop-types";
import Modal from "@shared/components/modals/Modal.jsx";
import styles from "./AvatarEditorModal.module.css";
import EditorHeader from "./parts/EditorHeader.jsx";
import EditorViewport from "./parts/EditorViewport.jsx";
import EditorControls from "./parts/EditorControls.jsx";

function AvatarEditorModalView({ labels, viewport, controls }) {
  return (
    <Modal onClose={controls.actions.onCancel} className={`modal-content ${styles.container}`}>
      <EditorHeader title={labels.title} description={labels.description} />
      <EditorViewport
        containerRef={viewport.containerRef}
        imageRef={viewport.imageRef}
        source={viewport.source}
        imageTransform={viewport.imageTransform}
        pointerHandlers={viewport.pointerHandlers}
        interactionLabel={viewport.interactionLabel}
        onImageLoad={viewport.onImageLoad}
      />
      <EditorControls zoom={controls.zoom} actions={controls.actions} labels={labels} />
    </Modal>
  );
}

AvatarEditorModalView.propTypes = {
  labels: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    zoomIn: PropTypes.string.isRequired,
    zoomOut: PropTypes.string.isRequired,
    cancel: PropTypes.string.isRequired,
    confirm: PropTypes.string.isRequired,
  }).isRequired,
  viewport: PropTypes.shape({
    containerRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
    imageRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
    source: PropTypes.string.isRequired,
    imageTransform: PropTypes.string.isRequired,
    pointerHandlers: PropTypes.shape({
      onPointerDown: PropTypes.func.isRequired,
      onPointerMove: PropTypes.func.isRequired,
      onPointerUp: PropTypes.func.isRequired,
    }).isRequired,
    interactionLabel: PropTypes.string.isRequired,
    onImageLoad: PropTypes.func.isRequired,
  }).isRequired,
  controls: PropTypes.shape({
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
  }).isRequired,
};

export default AvatarEditorModalView;
