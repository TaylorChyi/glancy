/**
 * 背景：
 *  - 头像上传流程仅支持原图直传，用户无法确认方向或裁剪范围，体验割裂。
 * 目的：
 *  - 引入模态化的头像编辑器，让用户在上传前完成缩放与取景确认。
 * 关键决策与取舍：
 *  - 采用“状态模式 + 策略函数”组合：状态管理留在父级，几何计算抽象为 avatarCropBox，
 *    避免组件内堆叠一次性计算；
 *  - 放弃第三方裁剪库，直接使用 Canvas 导出，保证轻量且可控。
 * 影响范围：
 *  - Profile 页面与未来需要头像裁剪的入口；
 *    其余模块未受影响。
 * 演进与TODO：
 *  - TODO: 后续可在此扩展旋转与键盘操作支持，以提升无障碍体验。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import Modal from "@/components/modals/Modal.jsx";
import styles from "./AvatarEditorModal.module.css";
import {
  clampOffset,
  clampZoom,
  computeDisplayMetrics,
  computeOffsetBounds,
} from "@/utils/avatarCropBox.js";
import { extractSvgIntrinsicSize } from "@/utils/svgIntrinsicSize.js";

const VIEWPORT_SIZE = 320;
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.2;

function ensureCanvas() {
  return document.createElement("canvas");
}

function AvatarEditorModal({
  open,
  source,
  onCancel,
  onConfirm,
  labels,
  isProcessing = false,
}) {
  const mergedLabels = {
    title: "调整头像位置",
    description: "拖动图片以确认正方向，放大后可观察正方形及其内切圆的呈现。",
    zoomIn: "放大",
    zoomOut: "缩小",
    cancel: "取消",
    confirm: "确认",
    ...labels,
  };
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const pointerIdRef = useRef(null);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const fallbackSizeControllerRef = useRef(null);
  const latestSourceRef = useRef(source);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!open) {
      return;
    }
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [open, source]);

  const {
    scaleFactor,
    width: displayWidth,
    height: displayHeight,
  } = useMemo(
    () =>
      computeDisplayMetrics({
        naturalWidth: naturalSize.width,
        naturalHeight: naturalSize.height,
        viewportSize: VIEWPORT_SIZE,
        zoom,
      }),
    [naturalSize.height, naturalSize.width, zoom],
  );

  const bounds = useMemo(
    () => computeOffsetBounds(displayWidth, displayHeight, VIEWPORT_SIZE),
    [displayHeight, displayWidth],
  );

  useEffect(() => {
    setOffset((prev) => clampOffset(prev, bounds));
  }, [bounds]);

  const handleImageLoad = useCallback(
    async (event) => {
      const image = event.currentTarget;
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (width > 0 && height > 0) {
        setNaturalSize({ width, height });
        return;
      }

      if (!source) {
        setNaturalSize({ width: 0, height: 0 });
        return;
      }

      if (fallbackSizeControllerRef.current) {
        fallbackSizeControllerRef.current.abort();
      }

      const controller = new AbortController();
      fallbackSizeControllerRef.current = controller;
      latestSourceRef.current = source;

      try {
        if (typeof fetch !== "function") {
          setNaturalSize({ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE });
          return;
        }
        const response = await fetch(source, { signal: controller.signal });
        if (!response.ok) {
          setNaturalSize({ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE });
          return;
        }
        const svgText = await response.text();
        if (controller.signal.aborted || latestSourceRef.current !== source) {
          return;
        }
        const svgSize = extractSvgIntrinsicSize(svgText);
        setNaturalSize(
          svgSize ?? { width: VIEWPORT_SIZE, height: VIEWPORT_SIZE },
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("avatar-editor-resolve-intrinsic-size", error);
        }
      } finally {
        if (fallbackSizeControllerRef.current === controller) {
          fallbackSizeControllerRef.current = null;
        }
      }
    },
    [source],
  );

  useEffect(() => {
    latestSourceRef.current = source;
    return () => {
      if (fallbackSizeControllerRef.current) {
        fallbackSizeControllerRef.current.abort();
        fallbackSizeControllerRef.current = null;
      }
    };
  }, [source]);

  const updateOffset = useCallback(
    (deltaX, deltaY) => {
      setOffset((prev) =>
        clampOffset({ x: prev.x + deltaX, y: prev.y + deltaY }, bounds),
      );
    },
    [bounds],
  );

  const handlePointerDown = useCallback((event) => {
    if (!containerRef.current) return;
    event.preventDefault();
    containerRef.current.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    lastPointRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handlePointerMove = useCallback(
    (event) => {
      if (pointerIdRef.current !== event.pointerId) return;
      const deltaX = event.clientX - lastPointRef.current.x;
      const deltaY = event.clientY - lastPointRef.current.y;
      if (deltaX === 0 && deltaY === 0) return;
      lastPointRef.current = { x: event.clientX, y: event.clientY };
      updateOffset(deltaX, deltaY);
    },
    [updateOffset],
  );

  const handlePointerUp = useCallback((event) => {
    if (pointerIdRef.current !== event.pointerId) return;
    pointerIdRef.current = null;
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => clampZoom(prev + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => clampZoom(prev - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }, []);

  const computeCrop = useCallback(async () => {
    const image = imageRef.current;
    if (!image || scaleFactor <= 0) {
      return null;
    }
    const sourceWidth = VIEWPORT_SIZE / scaleFactor;
    const sourceHeight = VIEWPORT_SIZE / scaleFactor;
    const sourceX =
      naturalSize.width / 2 + (-VIEWPORT_SIZE / 2 - offset.x) / scaleFactor;
    const sourceY =
      naturalSize.height / 2 + (-VIEWPORT_SIZE / 2 - offset.y) / scaleFactor;

    const canvas = ensureCanvas();
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("avatar-editor-context-missing");
    }

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    );

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("avatar-editor-blob-null"));
        }
      }, "image/png");
    });

    const previewUrl = URL.createObjectURL(blob);
    return { blob, previewUrl };
  }, [naturalSize.height, naturalSize.width, offset.x, offset.y, scaleFactor]);

  const handleConfirm = useCallback(async () => {
    try {
      const result = await computeCrop();
      if (!result) {
        return;
      }
      await onConfirm(result);
    } catch (error) {
      console.error(error);
    }
  }, [computeCrop, onConfirm]);

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
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scaleFactor}) translate(-50%, -50%)`,
          }}
        />
        <div className={styles.overlay} aria-hidden />
      </div>
      <div className={styles.controls}>
        <div className={styles["zoom-controls"]}>
          <button
            type="button"
            className={styles["zoom-button"]}
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM || isProcessing}
            aria-label={mergedLabels.zoomOut}
          >
            −
          </button>
          <button
            type="button"
            className={styles["zoom-button"]}
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM || isProcessing}
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
