/**
 * 背景：
 *  - 分享相关词条需要与字典主体解耦，以便未来扩展更多渠道选项。
 * 目的：
 *  - 提供分享流程的集中翻译，保证交互提示一致。
 * 关键决策与取舍：
 *  - 延续对象导出模式，方便在主入口通过扩展运算符合并；
 *  - 不额外拆分渠道子模块，保持当前范围简洁。
 * 影响范围：
 *  - 分享菜单、复制链接与图片导出流程。
 * 演进与TODO：
 *  - 后续若加入社交平台直连，可在此补充对应文案。
 */
const share = {
  share: "Share",
  shareMessage: 'Explore insights about "{term}" together.',
  shareSuccess: "Link ready to share whenever you are.",
  shareCopySuccess: "Link copied — paste it into any conversation.",
  shareFailed: "We couldn't complete the share. Please try again soon.",
  shareOptionLink: "Copy share link",
  shareOptionImage: "Export as reading image",
  shareImagePreparing: "Preparing image…",
  shareImageSuccess: "Image saved — share it freely.",
  shareImageFailed: "We couldn't export the image. Please try again.",
  shareMenuLabel: "Share options",
  shareAppName: "Glancy",
};

export default share;
