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
