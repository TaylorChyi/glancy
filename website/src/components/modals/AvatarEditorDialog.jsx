/**
 * 背景：
 *  - 用户更换头像时缺少裁剪预览，难以控制构图与最终效果。
 * 目的：
 *  - 提供统一的头像裁剪弹窗，支持缩放、拖拽与方向校准，并在确认后回调上层上传逻辑。
 * 关键决策与取舍：
 *  - 采用 BaseModal 承载弹窗骨架，沿用现有焦点管理与滚动锁定能力；裁剪交互通过 CSS 变量与原生 Canvas 实现，避免引入第三方库。
 * 影响范围：
 *  - 偏好设置页面、SettingsModal 及未来需要头像裁剪的入口。
 * 演进与TODO：
 *  - TODO: 后续可扩展旋转/翻转等高级编辑能力，并接入裁剪历史记录。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import BaseModal from "./BaseModal.jsx";
import styles from "./AvatarEditorDialog.module.css";
import { useLanguage } from "@/context";
import { AVATAR_EDITOR_STATUS } from "@/hooks/useAvatarEditorFlow.js";

const VIEWPORT_SIZE = 320;
const OUTPUT_SIZE = 512;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const editorShape = PropTypes.shape({
  open: PropTypes.bool.isRequired,
  status: PropTypes.string.isRequired,
  imageUrl: PropTypes.string,
  imageWidth: PropTypes.number,
  imageHeight: PropTypes.number,
  fileName: PropTypes.string,
  mimeType: PropTypes.string,
  error: PropTypes.oneOfType([PropTypes.instanceOf(Error), PropTypes.string]),
  isPreparing: PropTypes.bool,
  isProcessing: PropTypes.bool,
  handleCancel: PropTypes.func.isRequired,
  handleConfirm: PropTypes.func.isRequired,
});

function AvatarEditorDialog({ editor }) {
  const { t } = useLanguage();
  const imageRef = useRef(null);
  const dragStateRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [cropError, setCropError] = useState(null);

  const isOpen = Boolean(editor?.open);
  const status = editor?.status ?? AVATAR_EDITOR_STATUS.idle;
  const isReady = status === AVATAR_EDITOR_STATUS.ready;
  const isPreparing = Boolean(editor?.isPreparing);
  const isProcessing = Boolean(editor?.isProcessing);
  const hasRemoteError = status === AVATAR_EDITOR_STATUS.failed && editor?.error;

  const normalizedWidth = editor?.imageWidth ?? 0;
  const normalizedHeight = editor?.imageHeight ?? 0;

  const baseScale = useMemo(() => {
    if (!normalizedWidth || !normalizedHeight) {
      return 1;
    }
    const scaleForWidth = VIEWPORT_SIZE / normalizedWidth;
    const scaleForHeight = VIEWPORT_SIZE / normalizedHeight;
    return Math.max(scaleForWidth, scaleForHeight);
  }, [normalizedHeight, normalizedWidth]);

  const maxScale = useMemo(() => baseScale * 3, [baseScale]);

  useEffect(() => {
    if (!isOpen) {
      setCropError(null);
      return;
    }
    setScale(baseScale);
    setPosition({ x: 0, y: 0 });
    setCropError(null);
  }, [baseScale, editor?.imageUrl, isOpen]);

  useEffect(() => {
    setPosition((current) => {
      if (!normalizedWidth || !normalizedHeight) {
        return { x: 0, y: 0 };
      }
      const scaledWidth = normalizedWidth * scale;
      const scaledHeight = normalizedHeight * scale;
      const maxOffsetX = Math.max(0, (scaledWidth - VIEWPORT_SIZE) / 2);
      const maxOffsetY = Math.max(0, (scaledHeight - VIEWPORT_SIZE) / 2);
      return {
        x: clamp(current.x, -maxOffsetX, maxOffsetX),
        y: clamp(current.y, -maxOffsetY, maxOffsetY),
      };
    });
  }, [normalizedHeight, normalizedWidth, scale]);

  const clampPosition = useCallback(
    (candidate, nextScale) => {
      if (!normalizedWidth || !normalizedHeight) {
        return { x: 0, y: 0 };
      }
      const effectiveScale = Math.max(nextScale, baseScale);
      const scaledWidth = normalizedWidth * effectiveScale;
      const scaledHeight = normalizedHeight * effectiveScale;
      const maxOffsetX = Math.max(0, (scaledWidth - VIEWPORT_SIZE) / 2);
      const maxOffsetY = Math.max(0, (scaledHeight - VIEWPORT_SIZE) / 2);
      return {
        x: clamp(candidate.x, -maxOffsetX, maxOffsetX),
        y: clamp(candidate.y, -maxOffsetY, maxOffsetY),
      };
    },
    [baseScale, normalizedHeight, normalizedWidth],
  );

  const handleZoomChange = useCallback(
    (value) => {
      const numeric = Number.parseFloat(value);
      const nextScale = clamp(Number.isNaN(numeric) ? baseScale : numeric, baseScale, maxScale);
      setScale(nextScale);
      setPosition((current) => clampPosition(current, nextScale));
    },
    [baseScale, clampPosition, maxScale],
  );

  const handleZoomStep = useCallback(
    (direction) => {
      const step = Math.max(baseScale * 0.1, 0.1);
      setScale((current) => {
        const nextScale = clamp(current + direction * step, baseScale, maxScale);
        setPosition((positionCandidate) => clampPosition(positionCandidate, nextScale));
        return nextScale;
      });
    },
    [baseScale, clampPosition, maxScale],
  );

  const stopDragging = useCallback((event) => {
    const dragState = dragStateRef.current;
    if (!dragState || (event && dragState.pointerId !== event.pointerId)) {
      return;
    }
    if (event?.currentTarget && typeof event.currentTarget.releasePointerCapture === "function") {
      event.currentTarget.releasePointerCapture(dragState.pointerId);
    }
    dragStateRef.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      if (!isReady) {
        return;
      }
      event.preventDefault();
      const target = event.currentTarget;
      if (typeof target.setPointerCapture === "function") {
        target.setPointerCapture(event.pointerId);
      }
      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        origin: position,
      };
    },
    [isReady, position],
  );

  const handlePointerMove = useCallback(
    (event) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      const nextPosition = {
        x: dragState.origin.x + deltaX,
        y: dragState.origin.y + deltaY,
      };
      setPosition(clampPosition(nextPosition, scale));
    },
    [clampPosition, scale],
  );

  const handlePointerEnd = useCallback(
    (event) => {
      stopDragging(event);
    },
    [stopDragging],
  );

  const handleViewportKeyDown = useCallback(
    (event) => {
      if (!isReady) {
        return;
      }
      const step = event.shiftKey ? 16 : 8;
      let consumed = true;
      if (event.key === "ArrowUp") {
        setPosition((current) => clampPosition({ x: current.x, y: current.y - step }, scale));
      } else if (event.key === "ArrowDown") {
        setPosition((current) => clampPosition({ x: current.x, y: current.y + step }, scale));
      } else if (event.key === "ArrowLeft") {
        setPosition((current) => clampPosition({ x: current.x - step, y: current.y }, scale));
      } else if (event.key === "ArrowRight") {
        setPosition((current) => clampPosition({ x: current.x + step, y: current.y }, scale));
      } else {
        consumed = false;
      }
      if (consumed) {
        event.preventDefault();
      }
    },
    [clampPosition, isReady, scale],
  );

  const produceCroppedBlob = useCallback(async () => {
    const image = imageRef.current;
    if (!image || !normalizedWidth || !normalizedHeight) {
      throw new Error("avatar-editor-missing-image");
    }
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("avatar-editor-context-missing");
    }
    const scaledWidth = normalizedWidth * scale;
    const scaledHeight = normalizedHeight * scale;
    const left = (VIEWPORT_SIZE - scaledWidth) / 2 + position.x;
    const top = (VIEWPORT_SIZE - scaledHeight) / 2 + position.y;
    const sourceX = Math.max(0, -left / scale);
    const sourceY = Math.max(0, -top / scale);
    const sourceWidth = Math.min(normalizedWidth, VIEWPORT_SIZE / scale);
    const sourceHeight = Math.min(normalizedHeight, VIEWPORT_SIZE / scale);

    context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    context.drawImage(
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

    const mimeType = editor?.mimeType ?? "image/png";
    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("avatar-editor-crop-blob-empty"));
          }
        },
        mimeType,
        0.95,
      );
    });
  }, [editor?.mimeType, normalizedHeight, normalizedWidth, position.x, position.y, scale]);

  const handleConfirm = useCallback(async () => {
    if (!isReady || isProcessing) {
      return;
    }
    try {
      const blob = await produceCroppedBlob();
      await editor?.handleConfirm(blob);
      setCropError(null);
    } catch (error) {
      setCropError(error);
    }
  }, [editor, isProcessing, isReady, produceCroppedBlob]);

  const errorMessage = useMemo(() => {
    const defaultMessage = t.avatarEditorError ?? "无法保存头像，请重试";
    if (cropError?.message) {
      return cropError.message;
    }
    if (hasRemoteError) {
      if (typeof editor?.error === "string") {
        return editor.error;
      }
      if (editor?.error?.message) {
        return editor.error.message;
      }
      return defaultMessage;
    }
    return null;
  }, [cropError?.message, editor?.error, hasRemoteError, t.avatarEditorError]);

  if (!isOpen) {
    return null;
  }

  const zoomStepDisabled = !isReady || isProcessing;
  const zoomSliderStep = Math.max(baseScale * 0.01, 0.01);
  const zoomLabel = t.avatarEditorZoomLabel ?? "缩放";
  const cancelLabel =
    t.avatarEditorCancel ?? t.cancelButton ?? t.close ?? "取消";
  const confirmLabel = isProcessing
    ? t.avatarEditorProcessing ?? "保存中"
    : t.avatarEditorConfirm ?? "确认";
  const zoomOutLabel = t.avatarEditorZoomOut ?? "缩小";
  const zoomInLabel = t.avatarEditorZoomIn ?? "放大";
  const title = t.avatarEditorTitle ?? "调整头像";
  const description =
    t.avatarEditorInstruction ?? "拖动并缩放图片，圆形区域即为最终头像展示范围。";
  const preparingLabel = t.avatarEditorPreparing ?? "正在准备预览…";
  const previewAriaLabel = t.avatarEditorPreviewLabel ?? "头像裁剪预览";
  const previewAlt = editor?.fileName || (t.avatarEditorPreviewAlt ?? "头像预览");

  return (
    <BaseModal
      open={true}
      onClose={editor?.handleCancel}
      className={`${styles.dialog} modal-content`}
      closeLabel={cancelLabel}
    >
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{description}</p>
        </header>
        <div
          className={styles.viewport}
          role="region"
          aria-label={previewAriaLabel}
          tabIndex={isReady ? 0 : -1}
          onKeyDown={handleViewportKeyDown}
        >
          {isReady ? (
            <>
              <div
                className={styles.image}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerLeave={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                style={{
                  "--scale": scale,
                  "--offset-x": `${position.x}px`,
                  "--offset-y": `${position.y}px`,
                }}
              >
                <img ref={imageRef} src={editor?.imageUrl} alt={previewAlt} draggable={false} />
              </div>
              <div className={styles.overlay} aria-hidden="true">
                <div className={styles.shade} />
                <div className={styles.circle} />
              </div>
            </>
          ) : (
            <div className={styles.placeholder} aria-live="polite">
              {isPreparing ? preparingLabel : errorMessage ?? preparingLabel}
            </div>
          )}
        </div>
        <div className={styles.controls}>
          <span className={styles["zoom-label"]}>{zoomLabel}</span>
          <div className={styles["zoom-controls"]}>
            <button
              type="button"
              className={styles["zoom-button"]}
              onClick={() => handleZoomStep(-1)}
              disabled={zoomStepDisabled}
            >
              {zoomOutLabel}
            </button>
            <input
              type="range"
              min={baseScale}
              max={maxScale}
              step={zoomSliderStep}
              value={scale}
              onChange={(event) => handleZoomChange(event.target.value)}
              className={styles.slider}
              disabled={zoomStepDisabled}
            />
            <button
              type="button"
              className={styles["zoom-button"]}
              onClick={() => handleZoomStep(1)}
              disabled={zoomStepDisabled}
            >
              {zoomInLabel}
            </button>
          </div>
        </div>
        {errorMessage && !isPreparing ? (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={editor?.handleCancel}
            disabled={isProcessing}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={handleConfirm}
            disabled={!isReady || isProcessing}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

AvatarEditorDialog.propTypes = {
  editor: editorShape,
};

AvatarEditorDialog.defaultProps = {
  editor: undefined,
};

export default AvatarEditorDialog;
