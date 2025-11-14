import {
  createChapterAccumulator,
  finalizeChapterAccumulator,
  handleContent,
  handleHeading,
  isHeadingLine,
} from "./markdownChapterState.js";

export const joinChapterContent = (lines = []) =>
  lines
    .filter((line) => typeof line === "string" && line.trim().length > 0)
    .join("\n");

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

  let state = createChapterAccumulator(fallbackHeading);

  lines.forEach((line) => {
    state = isHeadingLine(line)
      ? handleHeading(line, state, fallbackHeading)
      : handleContent(line, state);
  });

  const finalizedState = finalizeChapterAccumulator(state, fallbackHeading);

  return finalizedState.chapters;
};

export { flushChapter, handleContent, handleHeading } from "./markdownChapterState.js";
