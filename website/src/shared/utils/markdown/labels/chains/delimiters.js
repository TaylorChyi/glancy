import {
  isInlineLabelTerminator,
  shouldSplitInlineLabel,
} from "../candidates.js";

export function restoreMissingLabelDelimiters(text) {
  const LABEL_TOKEN_PATTERN = /[A-Za-z\p{L}\u4e00-\u9fff][\w\u4e00-\u9fff-]*/gu;
  const SAFE_PREFIX_PATTERN = /[([{-–—>•·,，.。!！?？:：;；“”"'‘’]/u;

  const hasSafePrefix = (source, index) => {
    if (index === 0) {
      return true;
    }
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      const char = source[cursor];
      if (char === "\n") {
        return true;
      }
      if (/\s/.test(char)) {
        continue;
      }
      if (SAFE_PREFIX_PATTERN.test(char)) {
        return true;
      }
      return false;
    }
    return true;
  };

  const rewriteLine = (line) => {
    if (!line) {
      return line;
    }

    let cursor = 0;
    let result = "";
    let carryLabelContext = false;

    while (cursor < line.length) {
      LABEL_TOKEN_PATTERN.lastIndex = cursor;
      const match = LABEL_TOKEN_PATTERN.exec(line);
      if (!match) {
        result += line.slice(cursor);
        break;
      }

      const [token] = match;
      const start = match.index;
      const end = start + token.length;

      const separator = line.slice(cursor, start);
      const isLabel = shouldSplitInlineLabel(token);
      const canApply =
        isLabel && (carryLabelContext || hasSafePrefix(line, start));

      let shouldDropSeparator = false;
      if (canApply && separator && /^[.·]+$/.test(separator.trim())) {
        const lookahead = line
          .slice(end)
          .match(/^[.·]+([A-Za-z\p{L}\u4e00-\u9fff][\w\u4e00-\u9fff-]*)/u);
        shouldDropSeparator = Boolean(
          lookahead && shouldSplitInlineLabel(lookahead[1]),
        );
      }

      if (!shouldDropSeparator) {
        result += separator;
      }

      if (!canApply) {
        result += token;
        cursor = end;
        carryLabelContext = false;
        continue;
      }

      const immediateNext = line[end];
      if (immediateNext === ":" || immediateNext === "：") {
        result += token;
        cursor = end;
        carryLabelContext = false;
        continue;
      }

      let spacingEnd = end;
      while (spacingEnd < line.length && /[ \t]/.test(line[spacingEnd])) {
        spacingEnd += 1;
      }
      const spacing = line.slice(end, spacingEnd);
      const nextIndex = spacingEnd;

      const nextChar = nextIndex < line.length ? line[nextIndex] : "";
      if (isInlineLabelTerminator(nextChar)) {
        result += token;
        if (spacing) {
          result += spacing;
        }
        cursor = nextIndex;
        carryLabelContext = false;
        continue;
      }

      LABEL_TOKEN_PATTERN.lastIndex = nextIndex;
      const nextMatch = LABEL_TOKEN_PATTERN.exec(line);
      let hasImmediateNext = Boolean(
        nextMatch && nextMatch.index === nextIndex,
      );
      if (!hasImmediateNext && nextMatch) {
        const bridge = line.slice(nextIndex, nextMatch.index);
        if (/^[.·]+$/.test(bridge)) {
          hasImmediateNext = true;
        }
      }
      const nextToken = hasImmediateNext ? nextMatch[0] : null;
      const nextIsLabel = nextToken ? shouldSplitInlineLabel(nextToken) : false;

      result += `${token}:`;

      if (nextIsLabel) {
        const indent = spacing.length > 1 ? spacing.replace(/\S/g, " ") : "";
        result += `\n${indent}`;
        cursor = nextIndex;
        while (
          cursor < line.length &&
          (line[cursor] === "." || line[cursor] === "·")
        ) {
          cursor += 1;
        }
        carryLabelContext = true;
        continue;
      }

      const preservedSpacing = spacing.length > 0 ? spacing : " ";
      result += preservedSpacing;
      cursor = nextIndex;
      carryLabelContext = false;
    }

    return result;
  };

  return text.replace(/(^|\n)([^\n]*)/g, (full, boundary, line) => {
    const rewritten = rewriteLine(line);
    return `${boundary}${rewritten}`;
  });
}
