/**
 * 背景：
 *  - 头像上传流程缺乏可视化裁剪与方向控制，用户难以确认最终效果。
 * 目的：
 *  - 在统一模态中提供拖拽、缩放、旋转与预览功能，确保头像符合正方向与圆形展示预期。
 * 关键决策与取舍：
 *  - 采用多层 transform 结构分离平移/旋转/缩放，简化坐标系推导；
 *  - 输出固定尺寸的正方形位图，配合内切圆遮罩提示最终呈现；
 *  - 避免依赖第三方裁剪库，以轻量实现覆盖主要交互需求。
 * 影响范围：
 *  - 偏好设置页面与 SettingsModal 的头像更换体验。
 * 演进与TODO：
 *  - TODO: 后续可接入键盘微调与放大镜预览，以增强专业用户效率。
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import BaseModal from "./BaseModal.jsx";
import Button from "@/components/ui/Button";
import styles from "./AvatarCropperModal.module.css";

const VIEWPORT_SIZE = 320;
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

const clamp = (value, min, max) => {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

const normalizeRotation = (value) => ((value % 360) + 360) % 360;

const sanitizeFileBase = (base) => {
  if (typeof base !== "string") {
    return "avatar";
  }
  const trimmed = base.trim();
  if (!trimmed) {
    return "avatar";
  }
  return trimmed.replace(/\s+/g, "-");
};

const resolveExtension = (mime) => {
  if (mime === "image/jpeg" || mime === "image/jpg") {
    return "jpg";
  }
  if (mime === "image/webp") {
    return "webp";
  }
  return "png";
};

const buildFileName = (base, mime) => `${sanitizeFileBase(base)}-cropped.${resolveExtension(mime)}`;

function AvatarCropperModal({
  open,
  source,
  fileName,
  copy,
  onCancel,
  onConfirm,
  processing,
}) {
  const headingId = useId();
  const descriptionId = useId();
  const imageRef = useRef(null);
  const dragStateRef = useRef({ active: false, pointerId: null, lastX: 0, lastY: 0 });
  const mountedRef = useRef(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setIsExporting(false);
    }
  }, [open]);

  const isLoaded = imageSize.width > 0 && imageSize.height > 0;

  const baseScale = useMemo(() => {
    if (!isLoaded) {
      return 1;
    }
    const minDimension = Math.min(imageSize.width, imageSize.height);
    if (minDimension === 0) {
      return 1;
    }
    return VIEWPORT_SIZE / minDimension;
  }, [imageSize.height, imageSize.width, isLoaded]);

  const computedScale = baseScale * zoom;
  const normalizedRotation = normalizeRotation(rotation);
  const rotatedWidth = normalizedRotation % 180 === 0 ? imageSize.width : imageSize.height;
  const rotatedHeight = normalizedRotation % 180 === 0 ? imageSize.height : imageSize.width;
  const displayWidth = rotatedWidth * computedScale;
  const displayHeight = rotatedHeight * computedScale;

  const clampOffset = useCallback(
    (candidate) => {
      if (!isLoaded) {
        return { x: 0, y: 0 };
      }
      const maxX = Math.max(0, (displayWidth - VIEWPORT_SIZE) / 2);
      const maxY = Math.max(0, (displayHeight - VIEWPORT_SIZE) / 2);
      return {
        x: clamp(candidate.x, -maxX, maxX),
        y: clamp(candidate.y, -maxY, maxY),
      };
    },
    [displayHeight, displayWidth, isLoaded],
  );

  useEffect(() => {
    setOffset((current) => clampOffset(current));
  }, [clampOffset, zoom, rotation, imageSize.width, imageSize.height]);

  const handleImageLoad = useCallback((event) => {
    const target = event?.target ?? imageRef.current;
    if (!target) {
      return;
    }
    const naturalWidth = target.naturalWidth || target.width || 0;
    const naturalHeight = target.naturalHeight || target.height || 0;
    if (naturalWidth && naturalHeight) {
      setImageSize({ width: naturalWidth, height: naturalHeight });
    }
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      if (!isLoaded || processing || isExporting) {
        return;
      }
      event.preventDefault();
      const { pointerId, clientX, clientY, currentTarget } = event;
      dragStateRef.current = {
        active: true,
        pointerId,
        lastX: clientX,
        lastY: clientY,
      };
      currentTarget.setPointerCapture?.(pointerId);
    },
    [isExporting, isLoaded, processing],
  );

  const handlePointerMove = useCallback(
    (event) => {
      const state = dragStateRef.current;
      if (!state.active || state.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      const deltaX = event.clientX - state.lastX;
      const deltaY = event.clientY - state.lastY;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      setOffset((current) => clampOffset({ x: current.x + deltaX, y: current.y + deltaY }));
    },
    [clampOffset],
  );

  const endDrag = useCallback((event) => {
    const state = dragStateRef.current;
    if (!state.active || state.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    dragStateRef.current = { active: false, pointerId: null, lastX: 0, lastY: 0 };
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, []);

  const updateZoom = useCallback((next) => {
    setZoom((current) => {
      const candidate = typeof next === "function" ? next(current) : next;
      return clamp(candidate, MIN_ZOOM, MAX_ZOOM);
    });
  }, []);

  const handleZoomInput = useCallback((event) => {
    const value = Number.parseFloat(event.target.value);
    updateZoom(Number.isNaN(value) ? MIN_ZOOM : value);
  }, [updateZoom]);

  const handleZoomStep = useCallback(
    (delta) => {
      updateZoom((current) => current + delta);
    },
    [updateZoom],
  );

  const rotateByQuarter = useCallback((delta) => {
    setRotation((current) => normalizeRotation(current + delta));
  }, []);

  const isBusy = processing || isExporting || !isLoaded;

  const handleConfirm = useCallback(async () => {
    if (!imageRef.current || !isLoaded || processing || isExporting) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    const ratio = OUTPUT_SIZE / VIEWPORT_SIZE;
    const scale = computedScale * ratio;
    setIsExporting(true);
    context.save();
    context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    context.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    context.translate(offset.x * ratio, offset.y * ratio);
    context.rotate((normalizedRotation * Math.PI) / 180);
    context.scale(scale, scale);
    context.translate(-imageSize.width / 2, -imageSize.height / 2);
    context.drawImage(imageRef.current, 0, 0);
    context.restore();

    const blob = await new Promise((resolve) => {
      const mimeType = "image/png";
      canvas.toBlob((result) => resolve(result), mimeType, 0.92);
    });

    if (!blob) {
      if (mountedRef.current) {
        setIsExporting(false);
      }
      return;
    }

    const finalFile = new File([blob], buildFileName(fileName, blob.type || "image/png"), {
      type: blob.type || "image/png",
    });

    try {
      await onConfirm(finalFile);
    } finally {
      if (mountedRef.current) {
        setIsExporting(false);
      }
    }
  }, [computedScale, fileName, imageSize.height, imageSize.width, isExporting, isLoaded, normalizedRotation, offset.x, offset.y, onConfirm, processing]);

  const overlayDragging = dragStateRef.current.active;

  return (
    <BaseModal
      open={open}
      onClose={onCancel}
      className={`${styles.dialog} modal-content`}
      ariaLabelledBy={headingId}
      ariaDescribedBy={descriptionId}
    >
      <div className={styles.header}>
        <h2 id={headingId} className={styles.title}>
          {copy.title}
        </h2>
        <p id={descriptionId} className={styles.subtitle}>
          {copy.subtitle}
        </p>
        <p className={styles.orientation}>{copy.orientation}</p>
      </div>
      <div
        className={styles.viewport}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
      >
        <div
          className={styles["preview-layer"]}
          data-disabled={isBusy}
          data-dragging={overlayDragging}
        >
          <div className={styles.center}>
            <div
              className={styles.translate}
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
              }}
            >
              <div
                className={styles.rotate}
                style={{ transform: `rotate(${normalizedRotation}deg)` }}
              >
                <div
                  className={styles.scale}
                  style={{ transform: `scale(${computedScale})` }}
                >
                  {source ? (
                    <img
                      ref={imageRef}
                      src={source}
                      alt={copy.previewAlt}
                      className={styles.image}
                      onLoad={handleImageLoad}
                      draggable={false}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.overlay} data-testid="avatar-cropper-overlay" />
        </div>
      </div>
      <div className={styles.controls}>
        <div className={styles["zoom-controls"]}>
          <button
            type="button"
            className={styles["control-button"]}
            onClick={() => handleZoomStep(-ZOOM_STEP)}
            aria-label={copy.zoomOut}
            disabled={processing || isExporting || zoom <= MIN_ZOOM}
          >
            −
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={ZOOM_STEP}
            value={zoom}
            className={styles["zoom-slider"]}
            onChange={handleZoomInput}
            aria-label={copy.zoomLabel}
            disabled={processing || isExporting || !isLoaded}
          />
          <button
            type="button"
            className={styles["control-button"]}
            onClick={() => handleZoomStep(ZOOM_STEP)}
            aria-label={copy.zoomIn}
            disabled={processing || isExporting || zoom >= MAX_ZOOM}
          >
            +
          </button>
        </div>
        <div className={styles["rotate-controls"]}>
          <button
            type="button"
            className={styles["control-button"]}
            onClick={() => rotateByQuarter(-90)}
            aria-label={copy.rotateLeft}
            disabled={processing || isExporting || !isLoaded}
          >
            ↺
          </button>
          <span className={styles.helper} aria-hidden="true">
            {copy.rotationLabel}
          </span>
          <button
            type="button"
            className={styles["control-button"]}
            onClick={() => rotateByQuarter(90)}
            aria-label={copy.rotateRight}
            disabled={processing || isExporting || !isLoaded}
          >
            ↻
          </button>
        </div>
      </div>
      <p className={styles.helper}>{copy.helper}</p>
      <div className={styles.actions}>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isExporting}
        >
          {copy.cancel}
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleConfirm}
          disabled={processing || isExporting || !isLoaded}
          aria-busy={processing || isExporting}
        >
          {copy.confirm}
        </Button>
      </div>
    </BaseModal>
  );
}

AvatarCropperModal.propTypes = {
  open: PropTypes.bool.isRequired,
  source: PropTypes.string,
  fileName: PropTypes.string,
  copy: PropTypes.shape({
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    orientation: PropTypes.string.isRequired,
    cancel: PropTypes.string.isRequired,
    confirm: PropTypes.string.isRequired,
    zoomIn: PropTypes.string.isRequired,
    zoomOut: PropTypes.string.isRequired,
    rotateLeft: PropTypes.string.isRequired,
    rotateRight: PropTypes.string.isRequired,
    zoomLabel: PropTypes.string.isRequired,
    rotationLabel: PropTypes.string.isRequired,
    previewAlt: PropTypes.string.isRequired,
    helper: PropTypes.string,
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  processing: PropTypes.bool,
};

AvatarCropperModal.defaultProps = {
  source: null,
  fileName: "avatar",
  processing: false,
};

export default AvatarCropperModal;
