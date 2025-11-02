/**
 * 背景：
 *  - 通知、复制等常用交互提示散落在主翻译文件中，难以复用与统一升级。
 * 目的：
 *  - 集中整理交互控件提示文案，确保统一语气并便于复用。
 * 关键决策与取舍：
 *  - 使用单一导出常量承载所有控件提示，保持键名兼容；
 *  - 同步囊括版本切换等辅助控件，避免遗漏边角体验。
 * 影响范围：
 *  - 全站通知、复制、版本切换等交互组件。
 * 演进与TODO：
 *  - 若后续引入多语言 A/B 测试，可在此增加可观测性标记。
 */
export const INTERACTION_CONTROLS_TRANSLATIONS_ZH = {
  close: "关闭",
  reoutput: "重新输出",
  copyAction: "复制",
  copySuccess: "已复制到剪贴板",
  copyFailed: "复制失败",
  copyUnavailable: "暂不支持复制",
  copyEmpty: "暂无可复制内容",
  previousVersion: "上一版本",
  nextVersion: "下一版本",
  versionIndicator: "{current} / {total}",
  versionIndicatorEmpty: "暂无版本",
};
