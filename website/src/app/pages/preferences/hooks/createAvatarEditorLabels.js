/**
 * 背景：
 *  - 头像裁剪器的文案散落在主 Hook 中，调整任一词条都需修改主文件。
 * 目的：
 *  - 提供纯函数生成头像编辑器所需的 labels，保持默认文案一致。
 * 关键决策与取舍：
 *  - 保持与旧实现一致的兜底文案，避免回归；
 *  - 将默认描述写入函数内部，便于后续集中管理。
 */
export const createAvatarEditorLabels = (translations) => ({
  title: translations.avatarEditorTitle ?? "调整头像位置",
  description:
    translations.avatarEditorDescription ??
    "拖动图片以确认正方向，放大后可观察正方形及其内切圆的呈现。",
  zoomIn: translations.avatarZoomIn ?? "放大",
  zoomOut: translations.avatarZoomOut ?? "缩小",
  cancel: translations.avatarCancel ?? "取消",
  confirm: translations.avatarConfirm ?? "确认",
});
