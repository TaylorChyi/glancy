/**
 * 背景：
 *  - 行内标签与例句译文在换行时需要继承原列表或段落的缩进，否则会破坏视觉层级。
 * 目的：
 *  - 提供统一的缩进推导工具，供各策略模块复用，确保缩进逻辑一致且易于回归测试。
 * 关键决策与取舍：
 *  - 将列表缩进与通用行缩进拆分为两个纯函数，便于独立测试与组合使用；
 *  - 通过正则识别有序/无序列表标记，并以空格占位保证排版稳定。
 * 影响范围：
 *  - 行内标签换行、例句译文排版、标签链展开等策略模块。
 * 演进与TODO：
 *  - 若引入支持 Task List 等拓展语法，需在此扩充标记识别逻辑并补充测试。
 */
export function computeListIndentation(source, offset) {
  const lineStart = source.lastIndexOf("\n", offset) + 1;
  const line = source.slice(lineStart, offset + 1);
  const markerMatch = line.match(/^([ \t]*)(?:([-*+])|((?:\d+[.)])))(\s+)/);
  if (!markerMatch) {
    return null;
  }
  const [, leading = "", bullet = "", numbered = "", gap = ""] = markerMatch;
  const marker = bullet || numbered;
  const visualizedMarker = marker.replace(/[^\s]/g, " ");
  return `${leading}${visualizedMarker}${gap.replace(/[^\s]/g, " ")}`;
}

export function deriveLineIndentation(source, offset) {
  const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
  if (lineStart < 0) {
    return "";
  }
  const line = source.slice(lineStart, offset);
  const match = line.match(/^[ \t]*/);
  return match ? match[0] : "";
}
