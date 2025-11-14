import PropTypes from "prop-types";
import ViewportOverlay from "./ViewportOverlay.jsx";
import useViewportInteractions from "../hooks/useViewportInteractions.js";
import styles from "../AvatarEditorModal.module.css";

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

function EditorViewport({
  containerRef,
  imageRef,
  source,
  imageTransform,
  pointerHandlers,
  interactionLabel,
  onImageLoad,
}) {
  const interactionBindings = useViewportInteractions(pointerHandlers, interactionLabel);

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
  pointerHandlers: PropTypes.shape({
    onPointerDown: PropTypes.func.isRequired,
    onPointerMove: PropTypes.func.isRequired,
    onPointerUp: PropTypes.func.isRequired,
  }).isRequired,
  interactionLabel: PropTypes.string.isRequired,
  onImageLoad: PropTypes.func.isRequired,
};

export default EditorViewport;
