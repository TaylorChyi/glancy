export const joinChapterContent = (lines = []) =>
  lines
    .filter((line) => typeof line === "string" && line.trim().length > 0)
    .join("\n");

const isMarkdownHeading = (line) =>
  typeof line === "string" && /^#{1,6}\s+/.test(line.trim());

const stripHeadingMarker = (line) => line.replace(/^#{1,6}\s+/, "").trim();

const createEmptyChapter = (fallbackHeading) => ({
  heading: fallbackHeading,
  lines: [],
});

const cloneState = (state) => ({
  chapters: [...state.chapters],
  current: {
    heading: state.current.heading,
    lines: [...state.current.lines],
  },
});

export const flushChapter = (state, fallbackHeading) => {
  if (!state) {
    return state;
  }

  const { current, chapters } = state;
  const shouldFlush =
    current.lines.length > 0 || current.heading !== fallbackHeading;

  if (!shouldFlush) {
    return cloneState(state);
  }

  return {
    chapters: [
      ...chapters,
      { heading: current.heading, lines: [...current.lines] },
    ],
    current: createEmptyChapter(fallbackHeading),
  };
};

export const handleHeading = (line, state, fallbackHeading) => {
  const headingText = stripHeadingMarker(line) || fallbackHeading;
  const needsFlush =
    state.current.lines.length > 0 || state.current.heading !== fallbackHeading;
  const baseState = needsFlush ? flushChapter(state, fallbackHeading) : cloneState(state);

  return {
    chapters: baseState.chapters,
    current: {
      heading: headingText,
      lines: [],
    },
  };
};

const sanitizeContentLine = (line) =>
  typeof line === "string" ? line.trimEnd() : "";

export const handleContent = (line, state) => {
  const trimmed = sanitizeContentLine(line);
  if (!trimmed) {
    return cloneState(state);
  }

  return {
    chapters: [...state.chapters],
    current: {
      heading: state.current.heading,
      lines: [...state.current.lines, trimmed],
    },
  };
};

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

  let state = {
    chapters: [],
    current: createEmptyChapter(fallbackHeading),
  };

  lines.forEach((line) => {
    if (isMarkdownHeading(line)) {
      state = handleHeading(line, state, fallbackHeading);
      return;
    }

    state = handleContent(line, state);
  });

  const finalizedState = flushChapter(state, fallbackHeading);

  return finalizedState.chapters;
};
