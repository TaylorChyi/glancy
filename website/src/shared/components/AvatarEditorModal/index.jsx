/**
 * 背景：
 *  - 旧版 AvatarEditorModal 将状态、几何推导与 UI 堆叠在同一文件，
 *    体积过大且难以测试，长期依赖 lint 豁免。
 * 目的：
 *  - 将容器逻辑抽离至控制器 hook，并保留纯展示职责，
 *    以“童子军军规”方式逐步归还结构化技术债务。
 * 关键决策与取舍：
 *  - 采用控制器 + 展示组件组合模式，确保 UI 侧仅做渲染与绑定；
 *  - 兼容既有 Modal 与样式契约，避免对外接口破坏性变化。
 * 影响范围：
 *  - Profile 等依赖头像编辑模态的入口；
 *  - 未来如需独立页面或复合功能，可复用控制器能力。
 * 演进与TODO：
 *  - 控制器已预留扩展旋转/键盘操作的注入点，后续可通过特性开关演进。
 */

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
