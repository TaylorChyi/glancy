/**
 * 背景：
 *  - 释义示例中包含 [[segment]]、{{slot}}、#marker# 等分段标记，需要在换行前保留语义。
 * 目的：
 *  - 统一管理这些分段标记的匹配模式，供示例排版策略复用，避免不同模块各自 hardcode。
 * 关键决策与取舍：
 *  - 将模式整理为数组，保证按声明顺序逐个处理，便于未来新增协议标记时保持兼容。
 * 影响范围：
 *  - applyExampleSegmentationSpacing 等示例排版策略。
 */
export const SEGMENTATION_MARKER_PATTERNS = [
  /\[\[[^\]]+\]\]/g,
  /\{\{[^}]+\}\}/g,
  /#[^#\s]+#/g,
];
