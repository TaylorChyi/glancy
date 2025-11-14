import { isExampleLabel } from "../labels.js";
import { deriveExampleTranslationIndent } from "./indent.js";
import { extractParentheticalTranslation } from "./wrappers.js";
import {
  splitInlineTranslation,
  splitFollowingTranslation,
} from "./splitters.js";

function resolveInlineTranslation(prefix, rest) {
  const inlineSplit = splitInlineTranslation(prefix, rest);
  if (!inlineSplit) {
    return null;
  }
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

function resolveFollowingTranslation(prefix, trimmedExampleBody, nextLine) {
  const followingSplit = splitFollowingTranslation(
    prefix,
    trimmedExampleBody,
    nextLine,
  );
  if (!followingSplit) {
    return null;
  }
  const lines = [followingSplit.exampleLine];
  if (followingSplit.translationLine) {
    lines.push(followingSplit.translationLine);
  }
  return { lines, consumed: 1 };
}

function resolveParentheticalTranslation(prefix, trimmedExampleBody) {
  const fallbackTranslation =
    extractParentheticalTranslation(trimmedExampleBody);
  if (!fallbackTranslation) {
    return null;
  }
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

function resolveTranslationSegments(prefix, rest, nextLine) {
  const trimmedExampleBody = rest.trimEnd();
  return (
    resolveInlineTranslation(prefix, rest) ??
    resolveFollowingTranslation(prefix, trimmedExampleBody, nextLine) ??
    resolveParentheticalTranslation(prefix, trimmedExampleBody)
  );
}

function mergeTranslationLabelLines(text) {
  return text
    .replace(/翻\s*\n([ \t]+)译(?=[:：])/g, "\n$1翻译")
    .replace(/译\s*\n([ \t]+)文(?=[:：])/g, "\n$1译文");
}

function normalizeExampleTranslationLines(lines) {
  const normalized = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(
      /^(\s*(?:[-*+]|\d+[.)])?\s*\*\*([^*]+)\*\*:\s*)(.*)$/,
    );
    if (!match) {
      normalized.push(line);
      continue;
    }
    const [, prefix, label, rest] = match;
    if (!isExampleLabel(label)) {
      normalized.push(line);
      continue;
    }
    const resolved = resolveTranslationSegments(prefix, rest, lines[i + 1]);
    if (!resolved) {
      normalized.push(line);
      continue;
    }
    normalized.push(...resolved.lines);
    i += resolved.consumed;
  }
  return normalized;
}

export function ensureExampleTranslationLayout(text) {
  if (!text) {
    return text;
  }
  const merged = mergeTranslationLabelLines(text);
  const normalized = normalizeExampleTranslationLines(merged.split("\n"));
  return normalized.join("\n");
}
