import { useMemo } from "react";
import PropTypes from "prop-types";
import styles from "../AvatarEditorModal.module.css";

function useViewportInteractions({ pointerHandlers, label }) {
  const { onPointerDown, onPointerMove, onPointerUp } = pointerHandlers;

  return useMemo(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onPointerLeave: onPointerUp,
      role: "presentation",
      "aria-label": label,
    }),
    [label, onPointerDown, onPointerMove, onPointerUp],
  );
}

function ViewportImage({ imageRef, source, imageTransform, onImageLoad }) {
  return (
    <img
      ref={imageRef}
      src={source}
      alt="avatar-preview"
      className={styles.image}
      draggable={false}
      onLoad={onImageLoad}
      style={{ transform: imageTransform }}
    />
  );
}

function ViewportOverlay() {
  return <div className={styles.overlay} aria-hidden />;
}

function EditorViewport({
  containerRef,
  imageRef,
  source,
  imageTransform,
  interactions,
  onImageLoad,
}) {
  const interactionBindings = useViewportInteractions(interactions);

  return (
    <div ref={containerRef} className={styles.viewport} {...interactionBindings}>
      <ViewportImage
        imageRef={imageRef}
        source={source}
        imageTransform={imageTransform}
        onImageLoad={onImageLoad}
      />
      <ViewportOverlay />
    </div>
  );
}

ViewportImage.propTypes = {
  imageRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  source: PropTypes.string.isRequired,
  imageTransform: PropTypes.string.isRequired,
  onImageLoad: PropTypes.func.isRequired,
};

EditorViewport.propTypes = {
  containerRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  imageRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  source: PropTypes.string.isRequired,
  imageTransform: PropTypes.string.isRequired,
  interactions: PropTypes.shape({
    pointerHandlers: PropTypes.shape({
      onPointerDown: PropTypes.func.isRequired,
      onPointerMove: PropTypes.func.isRequired,
      onPointerUp: PropTypes.func.isRequired,
    }).isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  onImageLoad: PropTypes.func.isRequired,
};

export default EditorViewport;
