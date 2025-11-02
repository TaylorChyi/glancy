/**
 * 背景：
 *  - Doubao 生成的例句与译文常黏在同一行或写在下一行缺少标识。
 * 目的：
 *  - 将译文拆到独立行并保留列表缩进，确保渲染易读。
 */
import { isExampleLabel } from "../labels.js";
import { deriveExampleTranslationIndent } from "./indent.js";
import { extractParentheticalTranslation } from "./wrappers.js";
import {
  splitInlineTranslation,
  splitFollowingTranslation,
} from "./splitters.js";

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
  const merged = text
    .replace(/翻\s*\n([ \t]+)译(?=[:：])/g, "\n$1翻译")
    .replace(/译\s*\n([ \t]+)文(?=[:：])/g, "\n$1译文");
  const lines = merged.split("\n");
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
  return normalized.join("\n");
}
