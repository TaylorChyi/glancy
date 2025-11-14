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

const sanitizeContentLine = (line) =>
  typeof line === "string" ? line.trimEnd() : "";

export const createChapterAccumulator = (fallbackHeading) => ({
  chapters: [],
  current: createEmptyChapter(fallbackHeading),
});

export const isHeadingLine = (line) => isMarkdownHeading(line);

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

export const finalizeChapterAccumulator = (state, fallbackHeading) =>
  flushChapter(state, fallbackHeading);
