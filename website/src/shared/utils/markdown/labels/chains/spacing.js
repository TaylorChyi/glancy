export const collectSpacingInfo = (line, end) => {
  let spacingEnd = end;
  while (spacingEnd < line.length && /[ \t]/.test(line[spacingEnd])) {
    spacingEnd += 1;
  }
  return {
    spacing: line.slice(end, spacingEnd),
    nextIndex: spacingEnd,
  };
};

export const advancePastDotLeaders = (line, cursor) => {
  let nextCursor = cursor;
  while (
    nextCursor < line.length &&
    (line[nextCursor] === "." || line[nextCursor] === "·")
  ) {
    nextCursor += 1;
  }
  return nextCursor;
};
