import PropTypes from "prop-types";
import Modal from "@shared/components/modals/Modal.jsx";
import useAvatarEditorController from "./hooks/useAvatarEditorController.js";
import styles from "./AvatarEditorModal.module.css";

function AvatarEditorModal({
  open,
  source,
  onCancel,
  onConfirm,
  labels,
  isProcessing = false,
}) {
  const {
    mergedLabels,
    imageTransform,
    imageRef,
    containerRef,
    isZoomInDisabled,
    isZoomOutDisabled,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleZoomIn,
    handleZoomOut,
    handleConfirm,
    handleImageLoad,
  } = useAvatarEditorController({
    open,
    source,
    onConfirm,
    labels,
    isProcessing,
  });

  if (!open) {
    return null;
  }

  return (
    <Modal onClose={onCancel} className={`modal-content ${styles.container}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{mergedLabels.title}</h3>
        <p className={styles.description}>{mergedLabels.description}</p>
      </div>
      <div
        ref={containerRef}
        className={styles.viewport}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="presentation"
        aria-label={mergedLabels.title}
      >
        <img
          ref={imageRef}
          src={source}
          alt="avatar-preview"
          className={styles.image}
          draggable={false}
          onLoad={handleImageLoad}
          style={{ transform: imageTransform }}
        />
        <div className={styles.overlay} aria-hidden />
      </div>
      <div className={styles.controls}>
        <div className={styles["zoom-controls"]}>
          <button
            type="button"
            className={styles["zoom-button"]}
            onClick={handleZoomOut}
            disabled={isZoomOutDisabled}
            aria-label={mergedLabels.zoomOut}
          >
            −
          </button>
          <button
            type="button"
            className={styles["zoom-button"]}
            onClick={handleZoomIn}
            disabled={isZoomInDisabled}
            aria-label={mergedLabels.zoomIn}
          >
            +
          </button>
        </div>
        <div className={styles["action-buttons"]}>
          <button
            type="button"
            className={`${styles["action-button"]} ${styles["cancel-button"]}`}
            onClick={onCancel}
            disabled={isProcessing}
          >
            {mergedLabels.cancel}
          </button>
          <button
            type="button"
            className={`${styles["action-button"]} ${styles["confirm-button"]}`}
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? `${mergedLabels.confirm}…` : mergedLabels.confirm}
          </button>
        </div>
      </div>
    </Modal>
  );
}

AvatarEditorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  source: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  labels: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    zoomIn: PropTypes.string,
    zoomOut: PropTypes.string,
    cancel: PropTypes.string,
    confirm: PropTypes.string,
  }),
  isProcessing: PropTypes.bool,
};

AvatarEditorModal.defaultProps = {
  source: "",
  labels: undefined,
  isProcessing: false,
};

export default AvatarEditorModal;
