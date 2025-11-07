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
