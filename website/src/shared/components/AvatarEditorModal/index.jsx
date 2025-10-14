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
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import Modal from "@shared/components/modals/Modal.jsx";
import styles from "./AvatarEditorModal.module.css";
import {
  clampOffset,
  clampZoom,
  computeCropSourceRect,
  computeDisplayMetrics,
  computeOffsetBounds,
  deriveCenteredViewportState,
} from "@shared/utils/avatarCropBox.js";
import { extractSvgIntrinsicSize } from "@shared/utils/svgIntrinsicSize.js";

const DEFAULT_VIEWPORT_SIZE = 320;
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.2;

const formatPixels = (value) => {
  if (!Number.isFinite(value)) {
    return "0px";
  }
  const rounded = Number(Math.abs(value) < 1e-4 ? 0 : value.toFixed(3));
  return `${Object.is(rounded, -0) ? 0 : rounded}px`;
};

const composeTranslate3d = (x, y) =>
  `translate3d(${formatPixels(x)}, ${formatPixels(y)}, 0)`;

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
  const shouldRecenterRef = useRef(true);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState(DEFAULT_VIEWPORT_SIZE);
  const { x: offsetX, y: offsetY } = offset;

  const recenterViewport = useCallback(
    ({
      naturalWidth: nextWidth,
      naturalHeight: nextHeight,
      viewport = viewportSize,
      zoom: targetZoom = MIN_ZOOM,
    } = {}) => {
      const safeViewport = viewport > 0 ? viewport : viewportSize;
      if (nextWidth <= 0 || nextHeight <= 0 || safeViewport <= 0) {
        return false;
      }

      /**
       * 背景说明：
       *  - 默认居中逻辑此前散落在组件内，zoom 与 offset 更新存在竞态风险。
       * 设计取舍：
       *  - 通过 deriveCenteredViewportState 聚合“缩放钳制 + 中心偏移”策略，
       *    保证任何重算场景均遵循一致的中心对齐规则。
       */
      const nextState = deriveCenteredViewportState({
        naturalWidth: nextWidth,
        naturalHeight: nextHeight,
        viewportSize: safeViewport,
        zoom: targetZoom,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      });

      setZoom(nextState.zoom);
      setOffset(nextState.offset);
      shouldRecenterRef.current = false;
      return true;
    },
    [viewportSize],
  );

  const resetView = useCallback(() => {
    /**
     * 背景说明：
     *  - 头像选图在切换图片时曾出现初始偏移量遗留，导致图像停留在边缘且需放大才可拖回中心。
     * 设计取舍：
     *  - 通过 shouldRecenterRef 标记触发一次性的居中重算，
     *    避免引入全局状态或耦合到父级；若直接 setOffset(0) 会在几何数据尚未更新时生效失效。
     */
    shouldRecenterRef.current = true;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    pointerIdRef.current = null;
    lastPointRef.current = { x: 0, y: 0 };
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    resetView();
  }, [open, resetView, source]);

  useEffect(() => {
    if (open) {
      return;
    }
    resetView();
    setNaturalSize({ width: 0, height: 0 });
  }, [open, resetView]);

  const {
    scaleFactor,
    width: displayWidth,
    height: displayHeight,
  } = useMemo(
    () =>
      computeDisplayMetrics({
        naturalWidth: naturalSize.width,
        naturalHeight: naturalSize.height,
        viewportSize,
        zoom,
      }),
    [naturalSize.height, naturalSize.width, viewportSize, zoom],
  );

  const bounds = useMemo(
    () => computeOffsetBounds(displayWidth, displayHeight, viewportSize),
    [displayHeight, displayWidth, viewportSize],
  );

  useEffect(() => {
    setOffset((prev) => clampOffset(prev, bounds));
  }, [bounds]);

  const imageTransform = useMemo(() => {
    /**
     * 背景说明：
     *  - 旧版 transform 依赖 CSS 百分比换算，缩放后会产生浮点误差，导致视觉中心与 cropBox 推导中心存在偏差。
     * 设计取舍：
     *  - 使用组合模式拆分出 composeTranslate3d，使“中心定位 + 偏移 + 原点归位”在数学上与 computeCropSourceRect 完全一致，
     *    避免补丁式写死样式顺序；若未来扩展旋转/镜像，只需在此追加对应矩阵片段。
     */
    const safeViewport = Number.isFinite(viewportSize) ? viewportSize : 0;
    const halfViewport = safeViewport / 2;
    const safeScale =
      Number.isFinite(scaleFactor) && scaleFactor > 0 ? scaleFactor : 1;
    const halfWidth =
      naturalSize.width > 0 && Number.isFinite(naturalSize.width)
        ? naturalSize.width / 2
        : 0;
    const halfHeight =
      naturalSize.height > 0 && Number.isFinite(naturalSize.height)
        ? naturalSize.height / 2
        : 0;
    const safeOffsetX = Number.isFinite(offsetX) ? offsetX : 0;
    const safeOffsetY = Number.isFinite(offsetY) ? offsetY : 0;

    return [
      composeTranslate3d(safeOffsetX, safeOffsetY),
      composeTranslate3d(halfViewport, halfViewport),
      `scale(${safeScale})`,
      composeTranslate3d(-halfWidth, -halfHeight),
    ].join(" ");
  }, [
    offsetX,
    offsetY,
    scaleFactor,
    viewportSize,
    naturalSize.width,
    naturalSize.height,
  ]);

  useEffect(() => {
    if (!open || !shouldRecenterRef.current) {
      return;
    }

    recenterViewport({
      naturalWidth: naturalSize.width,
      naturalHeight: naturalSize.height,
      viewport: viewportSize,
    });
  }, [
    naturalSize.height,
    naturalSize.width,
    open,
    recenterViewport,
    viewportSize,
    source,
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    const updateSize = () => {
      const nextSize = element.clientWidth;
      if (!Number.isFinite(nextSize) || nextSize <= 0) {
        return;
      }
      setViewportSize((previous) =>
        Math.abs(previous - nextSize) < 0.5 ? previous : nextSize,
      );
    };

    updateSize();

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(() => updateSize());
      observer.observe(element);
      return () => observer.disconnect();
    }

    if (typeof window !== "undefined") {
      const handleResize = () => updateSize();
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    return undefined;
  }, [open]);

  const handleImageLoad = useCallback(
    async (event) => {
      const image = event.currentTarget;
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (width > 0 && height > 0) {
        setNaturalSize({ width, height });
        if (shouldRecenterRef.current) {
          recenterViewport({
            naturalWidth: width,
            naturalHeight: height,
            viewport: viewportSize,
          });
        }
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
      const fallbackViewportSize = viewportSize || DEFAULT_VIEWPORT_SIZE;

      try {
        if (typeof fetch !== "function") {
          setNaturalSize({
            width: fallbackViewportSize,
            height: fallbackViewportSize,
          });
          if (shouldRecenterRef.current) {
            recenterViewport({
              naturalWidth: fallbackViewportSize,
              naturalHeight: fallbackViewportSize,
              viewport: fallbackViewportSize,
            });
          }
          return;
        }
        const response = await fetch(source, { signal: controller.signal });
        if (!response.ok) {
          setNaturalSize({
            width: fallbackViewportSize,
            height: fallbackViewportSize,
          });
          if (shouldRecenterRef.current) {
            recenterViewport({
              naturalWidth: fallbackViewportSize,
              naturalHeight: fallbackViewportSize,
              viewport: fallbackViewportSize,
            });
          }
          return;
        }
        const svgText = await response.text();
        if (controller.signal.aborted || latestSourceRef.current !== source) {
          return;
        }
        const svgSize = extractSvgIntrinsicSize(svgText) ?? {
          width: fallbackViewportSize,
          height: fallbackViewportSize,
        };
        setNaturalSize(svgSize);
        if (shouldRecenterRef.current) {
          recenterViewport({
            naturalWidth: svgSize.width,
            naturalHeight: svgSize.height,
            viewport: viewportSize || fallbackViewportSize,
          });
        }
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
    [recenterViewport, source, viewportSize],
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
    if (!image || scaleFactor <= 0 || viewportSize <= 0) {
      return null;
    }
    const cropRect = computeCropSourceRect({
      naturalWidth: naturalSize.width,
      naturalHeight: naturalSize.height,
      viewportSize,
      scaleFactor,
      offset,
    });

    if (cropRect.width <= 0 || cropRect.height <= 0) {
      return null;
    }

    const canvas = ensureCanvas();
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("avatar-editor-context-missing");
    }

    ctx.drawImage(
      image,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
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
  }, [
    naturalSize.height,
    naturalSize.width,
    offset,
    scaleFactor,
    viewportSize,
  ]);

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
            transform: imageTransform,
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
