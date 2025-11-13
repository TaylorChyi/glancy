import PropTypes from "prop-types";
import styles from "../AvatarEditorModal.module.css";

function EditorViewport({
  containerRef,
  imageRef,
  source,
  imageTransform,
  pointerHandlers,
  onImageLoad,
  title,
}) {
  return (
    <div
      ref={containerRef}
      className={styles.viewport}
      onPointerDown={pointerHandlers.onPointerDown}
      onPointerMove={pointerHandlers.onPointerMove}
      onPointerUp={pointerHandlers.onPointerUp}
      onPointerCancel={pointerHandlers.onPointerUp}
      onPointerLeave={pointerHandlers.onPointerUp}
      role="presentation"
      aria-label={title}
    >
      <img
        ref={imageRef}
        src={source}
        alt="avatar-preview"
        className={styles.image}
        draggable={false}
        onLoad={onImageLoad}
        style={{ transform: imageTransform }}
      />
      <div className={styles.overlay} aria-hidden />
    </div>
  );
}

EditorViewport.propTypes = {
  containerRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  imageRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  source: PropTypes.string.isRequired,
  imageTransform: PropTypes.string.isRequired,
  pointerHandlers: PropTypes.shape({
    onPointerDown: PropTypes.func.isRequired,
    onPointerMove: PropTypes.func.isRequired,
    onPointerUp: PropTypes.func.isRequired,
  }).isRequired,
  onImageLoad: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

export default EditorViewport;
