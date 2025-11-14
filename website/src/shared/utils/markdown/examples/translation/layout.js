import { isExampleLabel } from "../labels.js";
import { deriveExampleTranslationIndent } from "./indent.js";
import { extractParentheticalTranslation } from "./wrappers.js";
import {
  splitInlineTranslation,
  splitFollowingTranslation,
} from "./splitters.js";

function cleanupTranslationArtifacts(text) {
  return text
    .replace(/翻\s*\n([ \t]+)译(?=[:：])/g, "\n$1翻译")
    .replace(/译\s*\n([ \t]+)文(?=[:：])/g, "\n$1译文");
}

function resolveExampleTranslationLine(line, nextLine) {
  const match = line.match(
    /^(\s*(?:[-*+]|\d+[.)])?\s*\*\*([^*]+)\*\*:\s*)(.*)$/,
  );
  if (!match) {
    return { lines: [line], consumed: 0 };
  }

  const [, prefix, label, rest] = match;
  if (!isExampleLabel(label)) {
    return { lines: [line], consumed: 0 };
  }

  const resolved = resolveTranslationSegments(prefix, rest, nextLine);
  if (!resolved) {
    return { lines: [line], consumed: 0 };
  }

  return resolved;
}

function normalizeExampleTranslationLines(lines) {
  const normalized = [];
  for (let i = 0; i < lines.length; i += 1) {
    const resolution = resolveExampleTranslationLine(lines[i], lines[i + 1]);
    normalized.push(...resolution.lines);
    i += resolution.consumed;
  }
  return normalized;
}

function resolveTranslationSegments(prefix, rest, nextLine) {
  const inlineSplit = splitInlineTranslation(prefix, rest);
  if (inlineSplit) {
    const lines = [inlineSplit.exampleLine];
    if (inlineSplit.translationSegment) {
      const translationIndent = deriveExampleTranslationIndent(prefix);
      lines.push(
        `${translationIndent}${inlineSplit.translationSegment}`.replace(
          /[ \t]+$/u,
          "",
        ),
      );
    }
    return { lines, consumed: 0 };
  }

  const trimmedExampleBody = rest.trimEnd();
  const followingSplit = splitFollowingTranslation(
    prefix,
    trimmedExampleBody,
    nextLine,
  );
  if (followingSplit) {
    const lines = [followingSplit.exampleLine];
    if (followingSplit.translationLine) {
      lines.push(followingSplit.translationLine);
    }
    return { lines, consumed: 1 };
  }

  const fallbackTranslation =
    extractParentheticalTranslation(trimmedExampleBody);
  if (fallbackTranslation) {
    const { exampleBody, translation } = fallbackTranslation;
    const normalizedExample = exampleBody
      ? `${prefix}${exampleBody}`.trimEnd()
      : prefix.trimEnd();
    const translationIndent = deriveExampleTranslationIndent(prefix);
    return {
      lines: [
        normalizedExample.replace(/[ \t]+$/u, ""),
        `${translationIndent}**翻译**: ${translation}`.replace(/[ \t]+$/u, ""),
      ],
      consumed: 0,
    };
  }

  return null;
}

export function ensureExampleTranslationLayout(text) {
  if (!text) {
    return text;
  }

  const merged = cleanupTranslationArtifacts(text);
  const lines = merged.split("\n");
  const normalized = normalizeExampleTranslationLines(lines);
  return normalized.join("\n");
}
