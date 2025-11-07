export const joinChapterContent = (lines = []) =>
  lines
    .filter((line) => typeof line === "string" && line.trim().length > 0)
    .join("\n");

const isMarkdownHeading = (line) =>
  typeof line === "string" && /^#{1,6}\s+/.test(line.trim());

const stripHeadingMarker = (line) => line.replace(/^#{1,6}\s+/, "").trim();

/**
 * 意图：根据 Markdown 一级标题拆解章节。
 * 输入：按行拆分后的 Markdown 字符串数组、默认章节标题。
 * 输出：包含 heading 与 lines 的章节对象数组。
 * 流程：
 *  1) 遍历每行，识别标题并刷新当前章节；
 *  2) 将非空正文累积到章节 lines；
 *  3) 返回已收敛的章节集合。
 * 错误处理：若传入空数组则返回空集合。
 * 复杂度：O(n)，n 为行数。
 */
export const splitMarkdownLinesIntoChapters = (lines, fallbackHeading) => {
  if (!Array.isArray(lines) || lines.length === 0) {
    return [];
  }
  const chapters = [];
  let current = { heading: fallbackHeading, lines: [] };

  const flush = () => {
    if (current.lines.length === 0 && current.heading === fallbackHeading) {
      return;
    }
    chapters.push({ heading: current.heading, lines: [...current.lines] });
    current = { heading: fallbackHeading, lines: [] };
  };

  lines.forEach((line) => {
    if (isMarkdownHeading(line)) {
      if (current.lines.length > 0 || current.heading !== fallbackHeading) {
        flush();
      }
      const heading = stripHeadingMarker(line);
      current.heading = heading || fallbackHeading;
      return;
    }
    const trimmed = typeof line === "string" ? line.trimEnd() : "";
    if (trimmed.length > 0) {
      current.lines.push(trimmed);
    }
  });

  if (current.lines.length > 0 || current.heading !== fallbackHeading) {
    flush();
  }

  return chapters;
};
