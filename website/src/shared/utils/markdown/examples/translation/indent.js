/**
 * 背景：
 *  - 译文行需要继承列表缩进或自定义缩进，才能与例句对齐。
 * 目的：
 *  - 计算译文行的缩进字符串供布局逻辑复用。
 */
export function deriveExampleTranslationIndent(prefix) {
  const listMatch = prefix.match(/^([ \t]*)(?:([-*+])|((?:\d+[.)])))(\s+)/);
  if (listMatch) {
    const [, leading = "", bullet = "", numbered = "", gap = ""] = listMatch;
    const marker = bullet || numbered;
    const visualizedMarker = marker.replace(/[^\s]/g, " ");
    return `${leading}${visualizedMarker}${gap.replace(/[^\s]/g, " ")}`;
  }
  const leadingWhitespaceMatch = prefix.match(/^[ \t]+/);
  if (leadingWhitespaceMatch) {
    return leadingWhitespaceMatch[0];
  }
  return "  ";
}
