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
