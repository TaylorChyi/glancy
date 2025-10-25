/**
 * 背景：
 *  - 分享菜单的启用逻辑曾散落在多处，导致链接/长图渠道的判定不一致。
 * 目的：
 *  - 构建一个可扩展的分享模型生成器，以组合模式统一产出工具栏所需的结构。
 * 关键决策与取舍：
 *  - 采用纯函数暴露构造逻辑，方便未来在无 React 环境下复用；
 *  - 显式区分链接与图片渠道的可用性，避免 UI 误判。
 * 影响范围：
 *  - DictionaryExperience 工具栏及后续复用分享模型的特性。
 * 演进与TODO：
 *  - 后续若新增 PDF/社交媒体渠道，可在此追加判定并沿用同一模型结构。
 */
export function createDictionaryShareModel({
  shareUrl,
  onCopyLink,
  onExportImage,
  isImageExporting,
  canExportImage,
}) {
  const normalisedShareUrl =
    typeof shareUrl === "string" ? shareUrl.trim() : "";
  const copyChannelReady =
    normalisedShareUrl.length > 0 && typeof onCopyLink === "function";
  const exportableImage = Boolean(canExportImage);
  const imageChannelReady =
    exportableImage && typeof onExportImage === "function";
  const menuEnabled = copyChannelReady || imageChannelReady;

  return {
    canShare: menuEnabled,
    shareUrl: normalisedShareUrl,
    onCopyLink,
    onExportImage,
    isImageExporting: isImageExporting === true,
    canExportImage: exportableImage,
  };
}
