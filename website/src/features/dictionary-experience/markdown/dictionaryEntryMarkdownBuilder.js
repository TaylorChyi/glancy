import { normalizeDictionaryMarkdown } from "./dictionaryMarkdownNormalizer.js";

const DEFAULT_HEADINGS = Object.freeze({
  term: "# %term%",
  phonetic: "## 发音",
  definitions: "## 释义",
  variants: "## 变形",
  phrases: "## 常见词组",
});

const DEFAULT_LABELS = Object.freeze({
  phoneticEn: "英音",
  phoneticUs: "美音",
  synonyms: "同义词",
  antonyms: "反义词",
  related: "相关词",
  example: "例句",
  translation: "译文",
});

const toTrimmedString = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
};

const isNonEmptyArray = (candidate) =>
  Array.isArray(candidate) && candidate.length > 0;

const sanitizeText = (value) =>
  toTrimmedString(value).replace(/\s+/g, (segment, index) =>
    index === 0 ? "" : " ",
  );

class MarkdownStrategy {
  supports(entry) {
    return Boolean(
      entry && typeof entry.markdown === "string" && entry.markdown.trim(),
    );
  }

  build(entry) {
    return normalizeDictionaryMarkdown(entry.markdown);
  }
}

class LegacyEnglishStrategy {
  supports(entry) {
    if (!entry || typeof entry !== "object") return false;
    return (
      typeof entry.term === "string" ||
      isNonEmptyArray(entry.definitions) ||
      typeof entry.example === "string"
    );
  }

  build(entry) {
    const lines = [];
    const headings = DEFAULT_HEADINGS;

    const term = sanitizeText(entry.term);
    if (term) {
      lines.push(headings.term.replace("%term%", term));
      lines.push("");
    }

    if (entry.phonetic) {
      lines.push(headings.phonetic);
      lines.push(
        `- ${DEFAULT_LABELS.phoneticEn}：${sanitizeText(entry.phonetic)}`,
      );
      lines.push("");
    }

    if (isNonEmptyArray(entry.definitions)) {
      lines.push(headings.definitions);
      entry.definitions.forEach((definition, index) => {
        const content = sanitizeText(definition);
        if (content) {
          lines.push(`${index + 1}. ${content}`);
        }
      });
      lines.push("");
    }

    const example = sanitizeText(entry.example);
    if (example) {
      lines.push(`- ${DEFAULT_LABELS.example}：${example}`);
      lines.push("");
    }

    return normalizeDictionaryMarkdown(lines.join("\n").trim());
  }
}

class StructuredChineseStrategy {
  supports(entry) {
    if (!entry || typeof entry !== "object") return false;
    return (
      Object.prototype.hasOwnProperty.call(entry, "发音解释") ||
      Object.prototype.hasOwnProperty.call(entry, "常见词组") ||
      Object.prototype.hasOwnProperty.call(entry, "发音")
    );
  }

  build(entry) {
    const headings = DEFAULT_HEADINGS;
    const labels = DEFAULT_LABELS;
    const lines = [];

    const term = sanitizeText(entry["词条"] ?? entry.term);
    if (term) {
      lines.push(headings.term.replace("%term%", term));
      lines.push("");
    }

    const phonetic = entry["发音"] || {};
    const phoneticLines = [];
    const en = sanitizeText(phonetic["英音"]);
    const us = sanitizeText(phonetic["美音"]);
    if (en) {
      phoneticLines.push(`- ${labels.phoneticEn}：${en}`);
    }
    if (us) {
      phoneticLines.push(`- ${labels.phoneticUs}：${us}`);
    }
    if (phoneticLines.length > 0) {
      lines.push(headings.phonetic);
      lines.push(...phoneticLines);
      lines.push("");
    }

    const groups = Array.isArray(entry["发音解释"]) ? entry["发音解释"] : [];
    const definitionBlocks = [];
    groups.forEach((group, groupIndex) => {
      const senses = Array.isArray(group?.释义) ? group.释义 : [];
      senses.forEach((sense, senseIndex) => {
        const order = `${groupIndex + 1}.${senseIndex + 1}`;
        const definition = sanitizeText(sense?.定义);
        const category = sanitizeText(sense?.类别);
        const headline = [order, category, definition]
          .filter(Boolean)
          .join(category && definition ? " " : " ");
        if (headline) {
          definitionBlocks.push(
            `${order}. ${category ? `${category} · ` : ""}${definition}`,
          );
        }

        const relations = sense?.关系词 || {};
        const synonyms = Array.isArray(relations?.同义词)
          ? relations.同义词
          : [];
        const antonyms = Array.isArray(relations?.反义词)
          ? relations.反义词
          : [];
        const related = Array.isArray(relations?.相关词)
          ? relations.相关词
          : [];
        if (synonyms.length > 0) {
          definitionBlocks.push(
            `  - ${labels.synonyms}：${synonyms.map(sanitizeText).filter(Boolean).join("、")}`,
          );
        }
        if (antonyms.length > 0) {
          definitionBlocks.push(
            `  - ${labels.antonyms}：${antonyms.map(sanitizeText).filter(Boolean).join("、")}`,
          );
        }
        if (related.length > 0) {
          definitionBlocks.push(
            `  - ${labels.related}：${related.map(sanitizeText).filter(Boolean).join("、")}`,
          );
        }

        const examples = Array.isArray(sense?.例句) ? sense.例句 : [];
        examples.forEach((example) => {
          const source = sanitizeText(example?.源语言);
          const translation = sanitizeText(example?.翻译);
          if (source) {
            definitionBlocks.push(`  - ${labels.example}：${source}`);
          }
          if (translation) {
            definitionBlocks.push(`    ${labels.translation}：${translation}`);
          }
        });
      });
    });
    if (definitionBlocks.length > 0) {
      lines.push(headings.definitions);
      lines.push(...definitionBlocks);
      lines.push("");
    }

    const variants = Array.isArray(entry["变形"]) ? entry["变形"] : [];
    const variantLines = variants
      .map((variant) => {
        const state = sanitizeText(variant?.状态);
        const form = sanitizeText(variant?.词形);
        if (!form) return "";
        return `- ${state ? `${state}：` : ""}${form}`;
      })
      .filter(Boolean);
    if (variantLines.length > 0) {
      lines.push(headings.variants);
      lines.push(...variantLines);
      lines.push("");
    }

    const phrases = Array.isArray(entry["常见词组"]) ? entry["常见词组"] : [];
    const phraseLines = phrases
      .map((phrase) => {
        if (typeof phrase === "string") {
          const value = sanitizeText(phrase);
          return value ? `- ${value}` : "";
        }
        const name = sanitizeText(phrase?.词组);
        const meaning = sanitizeText(phrase?.释义 ?? phrase?.解释);
        if (!name) return "";
        return meaning ? `- ${name} — ${meaning}` : `- ${name}`;
      })
      .filter(Boolean);
    if (phraseLines.length > 0) {
      lines.push(headings.phrases);
      lines.push(...phraseLines);
      lines.push("");
    }

    return normalizeDictionaryMarkdown(lines.join("\n").trim());
  }
}

const STRATEGIES = [
  new MarkdownStrategy(),
  new StructuredChineseStrategy(),
  new LegacyEnglishStrategy(),
];

/**
 * 意图：对外暴露统一的词条 Markdown 构建入口。
 * 输入：词条对象（可能为 Markdown 字符串/传统 JSON/英中 JSON），可选标题映射。
 * 输出：标准化后的 Markdown 字符串，若无法识别则回退为空串。
 * 流程：
 *  1) 依次尝试策略，命中后生成 Markdown；
 *  2) 若全部策略未命中则返回空字符串；
 * 错误处理：策略内部已对异常做兜底，确保返回字符串。
 */
export function buildDictionaryEntryMarkdown(entry) {
  for (const strategy of STRATEGIES) {
    if (strategy.supports(entry)) {
      return strategy.build(entry) ?? "";
    }
  }
  return "";
}

export const __INTERNAL__ = Object.freeze({
  STRATEGIES,
  MarkdownStrategy,
  StructuredChineseStrategy,
  LegacyEnglishStrategy,
});
