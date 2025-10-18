/**
 * 背景：
 *  - 控制器返回对象在不同 hook 之间重复手动拼装，既冗长又易遗漏字段。
 * 目的：
 *  - 将聚合逻辑集中到工厂函数，保持控制器主体简洁，方便未来调整输出结构。
 * 关键决策与取舍：
 *  - 工厂函数保持纯粹，接受依赖并直接返回展平后的状态；
 *  - 未引入类封装，避免过度抽象。
 * 影响范围：
 *  - AvatarEditorModal 控制器的返回值结构。
 * 演进与TODO：
 *  - 若后续需要透出更多交互状态，可在此集中扩展字段。
 */

const controllerStateFactory = ({
  viewport,
  pointer,
  zoomControls,
  mergedLabels,
  handleConfirm,
  handleImageLoad,
}) => ({
  mergedLabels,
  imageTransform: viewport.imageTransform,
  imageRef: viewport.imageRef,
  containerRef: viewport.containerRef,
  handlePointerDown: pointer.handlePointerDown,
  handlePointerMove: pointer.handlePointerMove,
  handlePointerUp: pointer.handlePointerUp,
  handleZoomIn: zoomControls.handleZoomIn,
  handleZoomOut: zoomControls.handleZoomOut,
  isZoomInDisabled: zoomControls.isZoomInDisabled,
  isZoomOutDisabled: zoomControls.isZoomOutDisabled,
  handleConfirm,
  handleImageLoad,
});

export default controllerStateFactory;
