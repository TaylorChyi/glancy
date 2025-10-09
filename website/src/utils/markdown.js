const MARKDOWN_KEY = '"markdown"';

const WHITESPACE_RE = /\s/;

const NEWLINE_NORMALIZER = /\r\n?|\u2028|\u2029/g;
const HEADING_WITHOUT_SPACE = /^(#{1,6})([^\s#])/gm;
const LIST_MARKER_WITHOUT_GAP = /^(\d+[.)])([^\s])/gm;
const HEADING_WITHOUT_PADDING = /([^\n])\n(#{1,6}\s)/g;
const HEADING_STUCK_TO_PREVIOUS = /([^\n\s])((?:#{1,6})(?=\S))/g;
const BROKEN_HEADING_LINE_PATTERN = /^(#{1,6})(?:[ \t]*)\n([ \t]*)(\S[^\n]*)$/gm;
const SECTION_HEADING_TOKENS = new Set(
  [
    "definition",
    "definitions",
    "meaning",
    "meanings",
    "释义",
    "解释",
    "含义",
    "historicalresonance",
    "synonym",
    "synonyms",
    "同义词",
    "antonym",
    "antonyms",
    "反义词",
    "related",
    "relatedwords",
    "相关词",
    "相关词汇",
    "variation",
    "variations",
    "变体",
    "变形",
    "词形",
    "derivativesextendedforms",
    "derivatives",
    "extendedforms",
    "phrase",
    "phrases",
    "常见词组",
    "词组",
    "collocation",
    "collocations",
    "example",
    "examples",
    "例句",
    "用法示例",
    "用例",
    "phonetic",
    "pronunciation",
    "音标",
    "发音",
  ].map((token) => token.toLowerCase()),
);
const SECTION_HEADING_TOKENS_DESC = Object.freeze(
  Array.from(SECTION_HEADING_TOKENS).sort((a, b) => b.length - a.length),
);
const SECTION_CONTENT_SPLIT_TRIGGER = /[\u4e00-\u9fff\s0-9:：,，。.!?;；、-]/u;
const HEADING_ATTACHED_LIST_PATTERN = /^(#{1,6}\s*)([^\n]*?)(-)(?!-)([^\n]+)$/gm;
const HEADING_INLINE_LABEL_PATTERN = /^(#{1,6}[^\n]*?)(\*\*([^*]+)\*\*:[^\n]*)/gm;
const INLINE_LABEL_PATTERN =
  /([^\n])((?:[ \t]*\t[ \t]*)|(?:[ \t]{2,}))(\*\*([^*]+)\*\*:[^\n]*)/g;
const INLINE_LABEL_NO_BOUNDARY_PATTERN = /([^\s>\n])(\*\*([^*]+)\*\*:[^\n]*)/g;
const INLINE_LABEL_BOUNDARY_PREFIX_RE =
  /[A-Za-z0-9\u4e00-\u9fff)\]}”’'".!?。，；：、]/u;
const COLLAPSED_LABEL_CHAIN_PATTERN =
  /(:)([A-Za-z\p{L}\u4e00-\u9fff][\w\u4e00-\u9fff-]*)(?=:[^\s])/gmu;
const ADJACENT_LABEL_PATTERN =
  /(?<=\S)[A-Za-z\p{L}\u4e00-\u9fff][\w\u4e00-\u9fff-]*:/gmu;
const BARE_INLINE_LABEL_PATTERN =
  /(^|[^\S\n>]|[)\]}”’'".!?。，；：、])([A-Za-z\p{L}\u4e00-\u9fff][\w.\u4e00-\u9fff-]*)(?=:(?!\/\/))/gmu;
const COLON_WITHOUT_SPACE_PATTERN = /:([^\s])/g;
const DECORATED_LABEL_VALUE_PATTERN = /(\*\*([^*]+)\*\*):\s*([^\n]*)/g;
const DANGLING_LABEL_SEPARATOR_PATTERN =
  /([^\n]*?)(?:\s*-\s*)\n([ \t]*)(\*\*([^*]+)\*\*:[^\n]*)/g;
const DANGLING_LABEL_INLINE_CHAIN_PATTERN =
  /(?<=\S)([ \t]*-)[ \t]*(\*\*([^*]+)\*\*:[^\n]*)/g;
const DANGLING_LABEL_SPACE_CHAIN_PATTERN =
  /(?<=\S)([ \t]{2,})(\*\*([^*]+)\*\*:[^\n]*)/g;

// 说明：
//  - LLM 在英译英响应中可能仅保留单个空格作为段落分隔。
//  - 若仅依赖 `INLINE_LABEL_PATTERN`（要求至少两个空格），上述场景会漏判。
//  - 为保持缩进计算逻辑复用，单空格匹配交由二次替换时处理。
const INLINE_LABEL_SINGLE_SPACE_PATTERN =
  /(\S)([ \t])(?=\*\*([^*]+)\*\*:[^\n]*)/g;
const INLINE_LABEL_HYPHEN_GAP_PATTERN =
  /(?<=\S)([ \t]*-[ \t]*)(?=\*\*([^*]+)\*\*:[^\n]*)/gu;

const INLINE_LABEL_CAMEL_CASE = /([a-z])(\p{Lu})/gu;

const INLINE_LABEL_DELIMITER = /[^a-z\u4e00-\u9fff]+/giu;

const ASCII_PUNCTUATION = new Set([",", ".", "!", "?", ";"]);

const ASCII_PUNCTUATION_BOUNDARY = new Set([
  "\t",
  " ",
  "\n",
  "\r",
  ")",
  "]",
  "}",
  ">",
  "'",
  '"',
  "*",
  "_",
]);

const EXAMPLE_LABEL_TOKENS = new Set([
  "example",
  "examples",
  "例句",
  "用法示例",
  "用例",
]);

const TRANSLATION_LABEL_TOKENS = new Set([
  "translation",
  "translations",
  "翻译",
  "译文",
]);

const INLINE_TRANSLATION_LABEL_PATTERN =
  /(?:^|(?<=\s)|(?<=[\p{P}\p{S}]))(\*\*([^*]+)\*\*|[\p{L}\p{N}]{1,32})(?:\s*)([:：])/gu;

const TRANSLATION_LABEL_BOUNDARY_PATTERN = /[\p{L}\p{N}*]/u;

const SEGMENTATION_MARKER_PATTERNS = [
  /\[\[[^\]]+\]\]/g,
  /\{\{[^}]+\}\}/g,
  /#[^#\s]+#/g,
];

// 说明：
//  - 这些标签来自后端 Markdown 解析器的 Section 定义，覆盖了 LLM 输出中常见的段落元信息。
//  - 目标是保持前后端对「需要独立换行的行内标签」的识别一致，避免前端额外维护语言分支。
//  - 2025-02 抖宝协议修订新增 Recommended Audience 等教学标签，后端已在 `MarkdownWordExtractor.resolveSection` 对应扩展；此处同步前端词表。
//  - 同步机制：后续若 Doubao 协议再扩展 Section，请先更新后端解析映射，再按原顺序在此常量补齐，确保排版规则与解析语义锁步演进。
const INLINE_LABEL_TOKENS = new Set(
  [
    "sense",
    "senses",
    "translation",
    "translations",
    "definition",
    "definitions",
    "meaning",
    "meanings",
    "example",
    "examples",
    "synonym",
    "synonyms",
    "antonym",
    "antonyms",
    "related",
    "relatedwords",
    "variation",
    "variations",
    "phrase",
    "phrases",
    "phonetic",
    "pronunciation",
    "释义",
    "解释",
    "含义",
    "例句",
    "用法示例",
    "用例",
    "翻译",
    "译文",
    "同义词",
    "反义词",
    "相关词",
    "相关词汇",
    "变体",
    "变形",
    "词形",
    "常见词组",
    "词组",
    "发音",
    "british",
    "american",
    "audio",
    "audionotes",
    "frequency",
    "frequencyband",
    "proficiency",
    "benchmark",
    "proficiencybenchmark",
    "entry",
    "entrytype",
    "register",
    "registerlabels",
    "regional",
    "regionalvariation",
    "spelling",
    "capitalization",
    "variants",
    "spellingorcapitalizationvariants",
    "proper",
    "propernounhandling",
    "nuance",
    "semantic",
    "semanticfield",
    "usage",
    "usageinsight",
    "insight",
    "extended",
    "extendednotes",
    "recommendedaudience",
    "collocations",
    "setexpressions",
    "derivatives",
    "extendedforms",
    "historicalresonance",
    // Practice prompts 与答案标签来自新版释义流数据，需参与排版以维持可滚动的可读布局。
    "answer",
    "practiceprompts",
    "sentencecorrection",
    "contextualtranslation",
    "subsense",
    "subsenses",
  ].map((token) => token.toLowerCase()),
);

const INLINE_LABEL_DYNAMIC_PATTERNS = [
  /^(?:s|sense)\d+(?:[a-z]+\d*)*$/,
  /^example\d+$/,
  // PracticePrompts1.SentenceCorrection -> practiceprompts1sentencecorrection
  /^practiceprompts\d+(?:[a-z]+)?$/,
];

const HEADING_LIST_TITLES = new Set(
  [
    "音标",
    "词频等级",
    "词汇学信息",
    "常见搭配",
    "常见词组",
    "固定习语",
    "固定句型",
    "单词变形",
    "近义词",
    "反义词",
    "语法用法说明",
    "易混淆词",
    "地域差异",
    "词源",
    "相关派生词",
    "词根与构词法",
    "文化背景与典故",
    "历史语义演变",
    "专业领域用法",
  ].map((title) => title.replace(/\s+/g, "")),
);

function normalizeInlineLabelCandidate(raw) {
  if (!raw) {
    return "";
  }
  return raw
    .toString()
    .replace(/：/g, ":")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

function matchesDynamicInlineLabel(candidate) {
  if (!candidate) {
    return false;
  }
  return INLINE_LABEL_DYNAMIC_PATTERNS.some((pattern) =>
    pattern.test(candidate),
  );
}

function collectInlineLabelCandidates(label) {
  const keywords = collectInlineLabelKeywords(label);
  const candidates = new Set();
  candidates.add(normalizeInlineLabelCandidate(label));
  if (keywords.length > 0) {
    candidates.add(normalizeInlineLabelCandidate(keywords.join("")));
  }
  keywords.forEach((token) => {
    candidates.add(normalizeInlineLabelCandidate(token));
  });
  candidates.delete("");
  return candidates;
}

function isLikelyJson(text) {
  if (!text) return false;
  const first = text.trimStart()[0];
  return first === "{" || first === "[";
}

function normalizeNewlines(text) {
  return text.replace(NEWLINE_NORMALIZER, "\n");
}

function ensureHeadingSpacing(text) {
  return text.replace(
    HEADING_WITHOUT_SPACE,
    (_, hashes, rest) => `${hashes} ${rest}`,
  );
}

function ensureHeadingPadding(text) {
  return text.replace(
    HEADING_WITHOUT_PADDING,
    (_, before, heading) => `${before}\n\n${heading}`,
  );
}

function ensureHeadingLineBreak(text) {
  return text.replace(
    HEADING_STUCK_TO_PREVIOUS,
    (match, before, hashes, offset, source) => {
      const hashIndex = offset + before.length;
      if (hashes.length === 1) {
        const lineStart = source.lastIndexOf("\n", hashIndex - 1) + 1;
        const lineBefore = source.slice(lineStart, hashIndex);
        const hasHeadingCue = /[:：)）】]/u.test(lineBefore);
        if (!hasHeadingCue) {
          return match;
        }
      }
      return `${before}\n${hashes}`;
    },
  );
}

function isListMarkerCandidate(segment) {
  const trimmed = segment.trimStart();
  if (!trimmed) {
    return false;
  }
  if (/^[-*+][ \t]+/.test(trimmed)) {
    return true;
  }
  if (/^\d+[.)][ \t]+/.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * 背景：
 *  - Doubao 返回的词典标题偶发被拆成两行，首行仅剩下 `##` 而正文换到下一行，
 *    前端渲染后标题会出现空白行，与生成模板要求冲突。
 * 目的：
 *  - 将被强制换行的标题重新合并为单行，确保 heading 语义与视觉表现一致。
 * 关键决策与取舍：
 *  - 仅在下一行不是列表、编号或新的标题时执行合并，避免误将合法内容拼接进标题。 
 * 影响范围：
 *  - 词典 Markdown 归一化流程，在 polishDictionaryMarkdown 中作为早期修复步骤。
 */
function mergeBrokenHeadingLines(text) {
  return text.replace(
    BROKEN_HEADING_LINE_PATTERN,
    (match, hashes, _indent, body) => {
      if (!body) {
        return match;
      }
      const normalizedBody = body.trim();
      if (!normalizedBody) {
        return match;
      }
      if (normalizedBody.startsWith("#")) {
        return match;
      }
      if (isListMarkerCandidate(normalizedBody)) {
        return match;
      }
      return `${hashes} ${normalizedBody}`;
    },
  );
}

function normalizeHeadingTitle(title) {
  return title.replace(/[\s：:]+/g, "");
}

function normalizeHeadingIdentifier(candidate) {
  if (!candidate) {
    return "";
  }
  return candidate
    .toLowerCase()
    .replace(/[：:]/g, "")
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, "");
}

function buildNormalizedIndexSegments(source) {
  let normalized = "";
  const segments = [];
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (/[^\p{L}\p{N}\u4e00-\u9fff]/u.test(char)) {
      continue;
    }
    normalized += char.toLowerCase();
    segments.push({
      normalizedLength: normalized.length,
      endIndex: index + 1,
    });
  }
  return { normalized, segments };
}

function sliceByNormalizedLength(source, segments, length) {
  for (let index = 0; index < segments.length; index += 1) {
    if (segments[index].normalizedLength >= length) {
      return source.slice(0, segments[index].endIndex);
    }
  }
  return source;
}

function shouldSplitSectionHeadingRest(rest) {
  if (!rest) {
    return false;
  }
  const trimmed = rest.trim();
  if (!trimmed) {
    return false;
  }
  return SECTION_CONTENT_SPLIT_TRIGGER.test(trimmed);
}

/**
 * 背景：
 *  - Doubao 协议返回的章节标题常在同一行携带正文，例如 `## 释义 1. ...`，导致前端折叠按钮
 *    将整句视为标题，严重影响信息架构与可读性。
 * 目的：
 *  - 将归属词典章节的标题与正文拆分到独立行，保持 Markdown 语义清晰并为折叠组件提供纯净标题。
 * 关键决策与取舍：
 *  - 仅对与后端章节映射一致的标题关键字（definitions/synonyms 等）生效，避免误拆普通文章标题；
 *  - 使用字符级索引按归一化后的 token 长度定位前缀，以兼容多语言与包含空格/符号的标题。
 * 影响范围：
 *  - polishDictionaryMarkdown 的章节整理流程；MarkdownRenderer 折叠按钮的展示文本。
 */
function isolateSectionHeadingContent(text) {
  return text.replace(
    /^(#{1,6})(\s*)([^\n]+)$/gm,
    (match, hashes, spacing, body) => {
      const trimmedBody = body.trimEnd();
      if (!trimmedBody) {
        return `${hashes}${spacing}${trimmedBody}`;
      }
      const { normalized, segments } = buildNormalizedIndexSegments(trimmedBody);
      if (!normalized) {
        return `${hashes}${spacing}${trimmedBody}`;
      }
      for (const token of SECTION_HEADING_TOKENS_DESC) {
        if (!normalized.startsWith(token)) {
          continue;
        }
        const headingPart = sliceByNormalizedLength(
          trimmedBody,
          segments,
          token.length,
        ).trimEnd();
        const rest = trimmedBody.slice(headingPart.length);
        if (!shouldSplitSectionHeadingRest(rest)) {
          return `${hashes}${spacing}${trimmedBody}`;
        }
        const normalizedIdentifier = normalizeHeadingIdentifier(headingPart);
        if (!SECTION_HEADING_TOKENS.has(normalizedIdentifier)) {
          return `${hashes}${spacing}${trimmedBody}`;
        }
        const trailing = rest.trimStart();
        return `${hashes} ${headingPart}\n${trailing}`;
      }
      return `${hashes}${spacing}${trimmedBody}`;
    },
  );
}

function shouldSeparateHeadingList(headingTitle, rest) {
  if (!rest || !/[:：]/.test(rest)) {
    return false;
  }
  const normalized = normalizeHeadingTitle(headingTitle);
  if (!normalized) {
    return false;
  }
  return HEADING_LIST_TITLES.has(normalized);
}

function separateHeadingListMarkers(text) {
  return text.replace(
    HEADING_ATTACHED_LIST_PATTERN,
    (match, prefix, headingBody, _dash, rest) => {
      const headingTitle = headingBody.trimEnd();
      if (!shouldSeparateHeadingList(headingTitle, rest)) {
        return match;
      }
      const normalizedHeading = `${prefix}${headingTitle}`.trimEnd();
      const listContent = rest.replace(/^\s*/, "");
      const bullet = listContent.startsWith("-")
        ? listContent
        : `- ${listContent}`;
      return `${normalizedHeading}\n${bullet}`;
    },
  );
}

/**
 * 背景：
 *  - LLM 生成的标题常与元信息标签紧贴，导致整段文本被视为同一标题行。
 * 目的：
 *  - 将标题后的首个可识别行内标签拆分到新行，恢复段落结构与 Markdown 渲染能力。
 * 关键决策与取舍：
 *  - 仅当标签命中既有词表时才拆分，避免误伤正常含粗体的标题内容。
 * 影响范围：
 *  - 词典页面的标题区块格式化逻辑，与后续标签换行流程协同生效。
 */
function separateHeadingInlineLabels(text) {
  return text.replace(
    HEADING_INLINE_LABEL_PATTERN,
    (match, heading, segment, label) => {
      if (!shouldSplitInlineLabel(label)) {
        return match;
      }
      const trimmedHeading = heading.replace(/\s+$/g, "");
      const normalizedSegment = segment.replace(/^\s+/, "");
      return `${trimmedHeading}\n${normalizedSegment}`;
    },
  );
}

function ensureListSpacing(text) {
  return text.replace(
    LIST_MARKER_WITHOUT_GAP,
    (_, marker, rest) => `${marker} ${rest}`,
  );
}

function computeListIndentation(source, offset) {
  const lineStart = source.lastIndexOf("\n", offset) + 1;
  const line = source.slice(lineStart, offset + 1);
  const markerMatch = line.match(/^([ \t]*)(?:([-*+])|((?:\d+[.)])))(\s+)/);
  if (!markerMatch) {
    return null;
  }
  const [, leading = "", bullet = "", numbered = "", gap = ""] = markerMatch;
  const marker = bullet || numbered;
  const visualizedMarker = marker.replace(/[^\s]/g, " ");
  return `${leading}${visualizedMarker}${gap.replace(/[^\s]/g, " ")}`;
}

function deriveLineIndentation(source, offset) {
  const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
  if (lineStart < 0) {
    return "";
  }
  const line = source.slice(lineStart, offset);
  const match = line.match(/^[ \t]*/);
  return match ? match[0] : "";
}

function resolveAdjacentLabelSplit(segment) {
  const token = segment.slice(0, -1);
  // Sense 编号标签需要整体交给 formatSenseLabel 处理，否则 `S1Definition` 会被拆成 `S` 与 `Definition`，
  // 导致编号丢失并与后端 Section 映射不一致。
  if (formatSenseLabel(token)) {
    return null;
  }
  let best = null;
  for (let i = 1; i < token.length; i += 1) {
    const suffix = token.slice(i);
    if (!shouldSplitInlineLabel(suffix)) {
      continue;
    }
    const prefix = token.slice(0, i);
    if (!prefix.trim()) {
      continue;
    }
    const strongBoundary = /^[A-Z\u4e00-\u9fff]/u.test(suffix);
    const normalized = normalizeInlineLabelCandidate(suffix);
    const exactMatch = INLINE_LABEL_TOKENS.has(normalized);
    const candidate = {
      prefix,
      label: suffix,
      strong: strongBoundary,
      exact: exactMatch,
      length: suffix.length,
      index: i,
    };
    if (!best) {
      best = candidate;
      continue;
    }
    if (candidate.exact !== best.exact) {
      best = candidate.exact ? candidate : best;
      continue;
    }
    if (candidate.strong !== best.strong) {
      best = candidate.strong ? candidate : best;
      continue;
    }
    if (candidate.length !== best.length) {
      best = candidate.length > best.length ? candidate : best;
      continue;
    }
    if (candidate.index < best.index) {
      best = candidate;
    }
  }
  if (!best) {
    return null;
  }
  return {
    prefix: best.prefix,
    label: best.label,
  };
}

/**
 * 背景：
 *  - 英译英字典输出会引入诸如“Pronunciation-British”或“AudioNotes”一类驼峰/连字符标签，
 *    若仅做简单去符号匹配会导致行内标签无法断行。
 * 目的：
 *  - 将不同形态（驼峰、连字符、空格）的标签拆解为语义关键词，复用同一套词表判断是否需要换行。
 * 关键决策与取舍：
 *  - 通过正则在小写化前先断开驼峰，再按非字母分割，避免维护额外的语言分支。
 * 影响范围：
 *  - 行内标签换行判断逻辑，覆盖中英双语与英译英场景。
 */
function collectInlineLabelKeywords(raw) {
  if (!raw) {
    return [];
  }
  const camelSeparated = raw
    .replace(/：/g, ":")
    .replace(INLINE_LABEL_CAMEL_CASE, "$1 $2")
    .toLowerCase();
  return camelSeparated
    .split(INLINE_LABEL_DELIMITER)
    .map((token) => token.trim())
    .filter(Boolean);
}

function shouldSplitInlineLabel(label) {
  const candidates = collectInlineLabelCandidates(label);
  if (candidates.size === 0) {
    return false;
  }
  for (const candidate of candidates) {
    if (INLINE_LABEL_TOKENS.has(candidate)) {
      return true;
    }
  }
  for (const candidate of candidates) {
    if (matchesDynamicInlineLabel(candidate)) {
      return true;
    }
  }
  return false;
}

function humanizeLabelFragment(label) {
  return label
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/[.]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function formatSenseLabel(label) {
  const normalized = normalizeInlineLabelCandidate(label);
  const match = normalized.match(/^(?:s|sense)(\d+)([a-z]*)$/);
  if (!match) {
    return null;
  }
  const [, index] = match;
  const categorySource = label.replace(/^[sS](?:ense)?\d+/, "");
  const spacedCategory = humanizeLabelFragment(categorySource);
  if (!spacedCategory) {
    return `Sense ${index}`;
  }
  const normalizedCategory = spacedCategory
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
  return `Sense ${index} · ${normalizedCategory}`;
}

function deriveInlineLabelDisplay(label) {
  const senseLabel = formatSenseLabel(label);
  if (senseLabel) {
    return senseLabel;
  }
  const normalized = normalizeInlineLabelCandidate(label);
  if (/^example\d+$/.test(normalized)) {
    const [, index = ""] = normalized.match(/^example(\d+)$/) || [];
    return index ? `Example ${index}` : humanizeLabelFragment(label);
  }
  return humanizeLabelFragment(label);
}

// 背景：
//  - 英译英响应在压缩空格后，常仅保留一个空格连接释义与后续标签。
//  - 为避免破坏列表结构，需在转换前对这些「单空格」进行定向扩充，
//    使其满足统一的换行判定条件。
function normalizeInlineLabelSpacing(text) {
  const hyphenNormalized = text.replace(
    INLINE_LABEL_HYPHEN_GAP_PATTERN,
    (match, separator, label) => {
      if (!shouldSplitInlineLabel(label)) {
        return match;
      }
      return " ".repeat(Math.max(2, separator.length));
    },
  );
  return hyphenNormalized.replace(
    INLINE_LABEL_SINGLE_SPACE_PATTERN,
    (match, before, space, label, offset, source) => {
      if (!shouldSplitInlineLabel(label)) {
        return match;
      }
      const lineStart = source.lastIndexOf("\n", offset) + 1;
      const prefix = source.slice(lineStart, offset + 1).trim();
      const isListMarker =
        prefix.length > 0 &&
        (/^[-*+]$/.test(prefix) || /^\d+[.)]$/.test(prefix));
      if (isListMarker) {
        return match;
      }
      return `${before}${space}${space}`;
    },
  );
}

function ensureInlineLabelLineBreak(text) {
  const normalizedSpacing = normalizeInlineLabelSpacing(text);
  return normalizedSpacing.replace(
    INLINE_LABEL_PATTERN,
    (match, before, spaces, segment, label, offset, source) => {
      if (!shouldSplitInlineLabel(label)) {
        return match;
      }
      if (spaces.length === 1) {
        // 背景：列表项首个标签通常仅由一个空格与标记（-、1. 等）分隔，
        // 若直接换行会破坏列表结构并阻断后续标签的匹配。
        // 取舍：通过回溯行首判断当前匹配是否仍在列表标记后，若是则保持原样。
        const lineStart = source.lastIndexOf("\n", offset) + 1;
        const prefix = source.slice(lineStart, offset + 1).trim();
        const isListMarker =
          prefix.length > 0 &&
          (/^[-*+]$/.test(prefix) || /^\d+[.)]$/.test(prefix));
        if (isListMarker) {
          return match;
        }
      }
      const indent =
        computeListIndentation(source, offset) || spaces.replace(/\S/g, " ");
      return `${before}\n${indent}${segment}`;
    },
  );
}

/**
 * 背景：
 *  - LLM 经常以 `Label: value - NextLabel: ...` 的形式串联词条元数据，
 *    在换行拆分后会遗留行尾连字符，导致 Markdown 渲染成 `value-` 的错误展示。
 * 目的：
 *  - 识别并移除这类“悬挂连字符”，维持原有缩进结构，恢复分隔标签的语义。
 * 关键决策与取舍：
 *  - 仅在上一行与下一行均命中受控的行内标签词表时才改写，
 *    避免误删自然语言中的合法连字符；
 *  - 保留下一行的既有缩进，确保列表与段落结构不受影响。
 * 影响范围：
 *  - 字典 Markdown 渲染阶段的标签段落拆分，可读性与换行逻辑更稳定。
 */
function resolveDanglingLabelSeparators(text) {
  const withoutTrailingHyphen = text.replace(
    DANGLING_LABEL_SEPARATOR_PATTERN,
    (match, previousLine, indent, segment, nextLabel) => {
      const hasLabeledPrefix = /\*\*([^*]+)\*\*:/u.test(previousLine);
      if (!hasLabeledPrefix) {
        return match;
      }
      if (!shouldSplitInlineLabel(nextLabel)) {
        return match;
      }
      const trimmedLine = previousLine.replace(/\s+$/u, "");
      return `${trimmedLine}\n${indent}${segment}`;
    },
  );
  const applyInlineRewrites = (input, pattern) => {
    let current = input;
    for (let iteration = 0; iteration < 4; iteration += 1) {
      let mutated = false;
      current = current.replace(
        pattern,
        (match, marker, segment, nextLabel, offset, source) => {
          if (!shouldSplitInlineLabel(nextLabel)) {
            return match;
          }
          mutated = true;
          const indent =
            deriveLineIndentation(source, offset) ||
            computeListIndentation(source, offset) ||
            "  ";
          return `\n${indent}${segment}`;
        },
      );
      if (!mutated) {
        break;
      }
    }
    return current;
  };

  let normalized = applyInlineRewrites(
    withoutTrailingHyphen,
    DANGLING_LABEL_INLINE_CHAIN_PATTERN,
  );
  normalized = applyInlineRewrites(
    normalized,
    DANGLING_LABEL_SPACE_CHAIN_PATTERN,
  );
  return normalized;
}

/**
 * 背景：
 *  - restoreMissingLabelDelimiters 会在冒号后补空格，再由 separateAdjacentInlineLabels 拆行。
 *    遇到 PracticePrompts1.SentenceCorrection 这类场景时，regex lookbehind 会遗留首字母到上一行，
 *    造成 `: S\nentence` 的断裂，影响 Markdown 渲染与滚动。
 * 目的：
 *  - 将 `: <非空格>\n` 的异常格式回写为换行后首字母紧随，恢复期望的 `:\nSentence` 排布。
 * 关键决策与取舍：
 *  - 仅在冒号后跟随单个非空白字符且立即换行时触发，避免误伤正常句子。
 * 影响范围：
 *  - Practice Prompts 等多段标签的换行整理，确保 MarkdownRenderer 可正确折叠与滚动。
 */
function normalizeLabelBreakArtifacts(text) {
  return text
    .replace(/: ([\p{Lu}])\n/gu, (_match, labelStart) => `:\n${labelStart}`)
    .replace(
      /([ \t]+)([\p{Lu}])\n([ \t]+)([\p{Ll}])/gu,
      (_match, _leading, upper, indent, lower) => `\n${indent}${upper}${lower}`,
    );
}

function enforceInlineLabelBoundary(text) {
  return text.replace(
    INLINE_LABEL_NO_BOUNDARY_PATTERN,
    (match, before, segment, label, offset, source) => {
      if (!INLINE_LABEL_BOUNDARY_PREFIX_RE.test(before)) {
        return match;
      }
      if (!shouldSplitInlineLabel(label)) {
        return match;
      }
      const indent = computeListIndentation(source, offset) || "";
      return `${before}\n${indent}${segment}`;
    },
  );
}

/**
 * 背景：
 *  - LLM 输出在 JSON 序列化后，常把 `Examples:Example1:...` 一类标签串联成单行。
 * 目的：
 *  - 识别「冒号紧邻标签」的串联模式，并在保持列表缩进的前提下拆行，恢复章节语义。
 * 关键决策与取舍：
 *  - 复用列表缩进推导逻辑，确保拆行后的补齐与既有列表渲染一致；
 *  - 仅在标签命中既有词表时生效，避免误拆普通冒号句。
 * 影响范围：
 *  - Markdown 词典条目中串联标签的换行处理。
 */
function expandCollapsedLabelChains(text) {
  return text.replace(
    COLLAPSED_LABEL_CHAIN_PATTERN,
    (match, colon, label, offset, source) => {
      if (!shouldSplitInlineLabel(label)) {
        return match;
      }
      const nextChar = source[offset + colon.length];
      if (nextChar === "\n") {
        return match;
      }
      const indent = computeListIndentation(source, offset) || "";
      return `${colon}\n${indent}${label}`;
    },
  );
}

/**
 * 背景：
 *  - 新模型在序列化 Markdown 时，偶尔会把 `EntryType:SingleWordUsageInsight:` 这类字段直接拼接，
 *    导致后续标签与前一个值之间没有任何空白字符，现有链式拆分逻辑无法生效。
 * 目的：
 *  - 识别紧邻在非空白字符后的标签，并补充换行与缩进，使标签重新回到独立行。
 * 关键决策与取舍：
 *  - 保留与 `computeListIndentation` 一致的缩进推导，避免破坏列表展示；
 *  - 仅在标签命中词表时拆分，防止误伤普通缩略词或时间格式。
 * 影响范围：
 *  - Markdown 词典条目的元数据段落换行能力，特别是缺失分隔符的串联字段。
 */
function separateAdjacentInlineLabels(text) {
  return text.replace(
    ADJACENT_LABEL_PATTERN,
    (segment, offset, source) => {
      const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
      const precedingSlice = source.slice(lineStart, offset);
      if (!precedingSlice.includes(":") && !precedingSlice.includes("：")) {
        return segment;
      }
      const boundaryChar = source[offset - 1];
      const resolved =
        boundaryChar === ":" || boundaryChar === "："
          ? resolveAdjacentLabelSplit(segment)
          : null;
      const indent =
        computeListIndentation(source, offset - 1) ||
        deriveLineIndentation(source, offset);
      if (!resolved) {
        return `\n${indent}${segment}`;
      }
      const { prefix, label } = resolved;
      return `${prefix}\n${indent}${label}:`;
    },
  );
}

/**
 * 背景：
 *  - 新版模型在序列化 Markdown 时，会把 `Senses s1Verb`、`Examples Example1` 等字段改写为以空格分隔，
 *    导致下游仅能识别冒号紧贴的链式标签逻辑失效。
 * 目的：
 *  - 在不破坏普通句子的前提下，将位于行首（或缩进行首）的标签对恢复为冒号连接形式，
 *    以复用既有的标签换行与加粗流程。
 * 关键决策与取舍：
 *  - 仅当「首个 token」与「后续 token」均命中标签词表时才回写冒号，避免误伤自然语言；
 *  - 保留原始缩进，保障列表项在恢复冒号后仍可计算正确的缩进层级。
 * 影响范围：
 *  - LLM 字典响应中缺失冒号的标签链恢复能力，与 `expandCollapsedLabelChains`、`decorateBareInlineLabels` 协同生效。
 */
function restoreMissingLabelDelimiters(text) {
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
      const canApply = isLabel && (carryLabelContext || hasSafePrefix(line, start));

      let shouldDropSeparator = false;
      if (canApply && separator && /^[.·]+$/.test(separator.trim())) {
        const lookahead = line
          .slice(end)
          .match(/^[.·]+([A-Za-z\p{L}\u4e00-\u9fff][\w\u4e00-\u9fff-]*)/u);
        shouldDropSeparator = Boolean(
          lookahead && shouldSplitInlineLabel(lookahead[1]),
        );
      }

      const isStructuralSeparator = shouldDropSeparator;


      if (!isStructuralSeparator) {
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

/**
 * 背景：
 *  - 串联标签往往以裸文本形式出现（缺少 `**` 包裹），导致前端无法复用统一格式化策略。
 * 目的：
 *  - 将命中标签词表的裸标签转为粗体，并拆解驼峰/数字界限以增强可读性。
 * 关键决策与取舍：
 *  - 保留原有大小写展示，同时仅在匹配词表时改写，避免误伤普通冒号句。
 * 影响范围：
 *  - 词典 Markdown 渲染的标签装饰逻辑。
 */
function decorateBareInlineLabels(text) {
  return text.replace(
    BARE_INLINE_LABEL_PATTERN,
    (match, leading, label, offset, source) => {
      const labelStart = offset + leading.length;
      const precedingChar = source[labelStart - 1];
      if (precedingChar === "*" || !shouldSplitInlineLabel(label)) {
        return match;
      }
      const display = deriveInlineLabelDisplay(label);
      return `${leading}**${display}**`;
    },
  );
}

/**
 * 背景：
 *  - 新增的 JSON 字段常以 `EntryType:SingleWord` 形式紧贴，缺乏冒号后的空格。
 * 目的：
 *  - 在不破坏 URL（`https://`）等合法用法的前提下，为冒号添加必要的视觉间隔。
 * 关键决策与取舍：
 *  - 通过回调判断冒号后是否为 `//`，保留协议格式；其它情况一律补空格以保证可读性。
 * 影响范围：
 *  - Markdown 词典条目中键值对的冒号展示样式。
 */
function ensureColonSpacing(text) {
  return text.replace(
    COLON_WITHOUT_SPACE_PATTERN,
    (match, next, offset, source) => {
      const previous = offset > 0 ? source[offset - 1] : "";
      if (next === "/" && source[offset + 2] === "/") {
        return match;
      }
      if (/\d/.test(previous) && /\d/.test(next)) {
        return match;
      }
      return `: ${next}`;
    },
  );
}

/**
 * 背景：
 *  - `EntryType:SingleWord` 等字段的值同样缺少空格，直接渲染可读性差。
 * 目的：
 *  - 在标签已加粗的前提下，仅对「无空格且驼峰/数字混排」的值进行语义化拆分。
 * 关键决策与取舍：
 *  - 依赖既有标签词表过滤作用范围，并保留含空格或标点的原始值，避免误改自然语言内容。
 * 影响范围：
 *  - 词典条目中的紧凑型元数据值展示。
 */
function humanizeCompactMetadataValues(text) {
  return text.replace(
    DECORATED_LABEL_VALUE_PATTERN,
    (match, labelToken, rawLabel, rawValue) => {
      if (!rawValue || /\s/.test(rawValue)) {
        return match;
      }
      if (!shouldSplitInlineLabel(rawLabel)) {
        return match;
      }
      const humanizedValue = rawValue
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/([A-Za-z])(\d)/g, "$1 $2")
        .replace(/(\d)([A-Za-z])/g, "$1 $2")
        .trim();
      if (humanizedValue === rawValue) {
        return match;
      }
      return `**${rawLabel}**: ${humanizedValue}`;
    },
  );
}

function decodeJsonString(raw) {
  let result = "";
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (char !== "\\") {
      result += char;
      continue;
    }
    const next = raw[i + 1];
    if (next === undefined) {
      result += "\\";
      break;
    }
    switch (next) {
      case "\\":
      case '"':
      case "'":
        result += next;
        i += 1;
        break;
      case "n":
        result += "\n";
        i += 1;
        break;
      case "r":
        result += "\r";
        i += 1;
        break;
      case "t":
        result += "\t";
        i += 1;
        break;
      case "b":
        result += "\b";
        i += 1;
        break;
      case "f":
        result += "\f";
        i += 1;
        break;
      case "u": {
        const hex = raw.slice(i + 2, i + 6);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          result += String.fromCharCode(parseInt(hex, 16));
          i += 5;
        } else {
          result += "\\u";
          i += 1;
        }
        break;
      }
      default:
        result += next;
        i += 1;
        break;
    }
  }
  return normalizeNewlines(result);
}

function readJsonString(source, startIndex) {
  if (source[startIndex] !== '"') return null;
  let index = startIndex + 1;
  let raw = "";
  while (index < source.length) {
    const ch = source[index];
    if (ch === "\\") {
      const next = source[index + 1];
      if (next === undefined) {
        raw += "\\";
        index += 1;
        break;
      }
      raw += ch + next;
      index += 2;
      continue;
    }
    if (ch === '"') {
      return { raw, closed: true, endIndex: index + 1 };
    }
    raw += ch;
    index += 1;
  }
  return { raw, closed: false, endIndex: index };
}

function findMarkdownValue(buffer) {
  const keyIndex = buffer.indexOf(MARKDOWN_KEY);
  if (keyIndex === -1) return null;
  let index = keyIndex + MARKDOWN_KEY.length;
  while (index < buffer.length && WHITESPACE_RE.test(buffer[index])) {
    index += 1;
  }
  if (buffer[index] !== ":") return null;
  index += 1;
  while (index < buffer.length && WHITESPACE_RE.test(buffer[index])) {
    index += 1;
  }
  if (buffer.startsWith("null", index)) {
    return { raw: "", closed: true };
  }
  if (buffer[index] !== '"') return null;
  return readJsonString(buffer, index);
}

export function extractMarkdownPreview(buffer) {
  if (!buffer) return "";
  if (!isLikelyJson(buffer)) {
    return normalizeNewlines(buffer);
  }
  const trimmed = buffer.trimStart();
  const value = findMarkdownValue(trimmed);
  if (!value) return null;
  if (!value.raw) return "";
  return decodeJsonString(value.raw);
}

function countBackticks(source, startIndex) {
  let length = 0;
  while (source[startIndex + length] === "`") {
    length += 1;
  }
  return length;
}

function isAsciiDigit(char) {
  return char >= "0" && char <= "9";
}

function isAsciiUppercase(char) {
  return char >= "A" && char <= "Z";
}

function isAsciiLetter(char) {
  return (char >= "A" && char <= "Z") || (char >= "a" && char <= "z");
}

function isHanChar(char) {
  return /\p{Script=Han}/u.test(char);
}

function isCjkPunctuation(char) {
  return /[\u3000-\u303F\uFF00-\uFF65。，；：！？、（）「」『』《》〈〉【】]/u.test(char);
}

function isSpacingCandidate(char) {
  if (!char) {
    return false;
  }
  if (isAsciiLetter(char) || isAsciiDigit(char)) {
    return true;
  }
  return isHanChar(char);
}

function shouldSkipPeriodSpacing(source, index) {
  const prev = source[index - 1];
  const next = source[index + 1];
  if (prev === "." || next === ".") {
    return true;
  }
  if (prev && next && isAsciiDigit(prev) && isAsciiDigit(next)) {
    return true;
  }
  if (prev && next && isAsciiUppercase(prev) && isAsciiUppercase(next)) {
    return true;
  }
  return false;
}

function shouldInsertPeriodSpace(prev, next) {
  if (!isSpacingCandidate(prev)) {
    return false;
  }
  if (isHanChar(next)) {
    return true;
  }
  return isAsciiUppercase(next);
}

/**
 * 意图：为英式标点补足空格，避免 Markdown 中文本与标点紧贴导致可读性下降。
 * 输入：原始 Markdown 文本字符串。
 * 输出：在允许位置补足空格后的 Markdown。
 * 流程：
 *  1) 顺序遍历字符并跟踪是否位于反引号包裹的代码段。
 *  2) 对于逗号、句号、感叹号、问号、分号，若后续紧跟文字则补充空格。
 * 错误处理：函数不抛出异常，遇到 nullish 输入直接返回原值。
 * 复杂度：O(n)，n 为文本长度；仅使用常数额外空间。
 */
function ensureEnglishPunctuationSpacing(text) {
  if (!text) {
    return text;
  }
  let result = "";
  let activeFenceSize = 0;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === "`") {
      const fenceSize = countBackticks(text, i);
      result += "`".repeat(fenceSize);
      i += fenceSize - 1;
      if (activeFenceSize === 0) {
        activeFenceSize = fenceSize;
      } else if (fenceSize >= activeFenceSize) {
        activeFenceSize = 0;
      }
      continue;
    }
    result += char;
    if (activeFenceSize > 0) {
      continue;
    }
    if (!ASCII_PUNCTUATION.has(char)) {
      continue;
    }
    const prev = text[i - 1];
    const next = text[i + 1];
    if (char === "." && shouldSkipPeriodSpacing(text, i)) {
      continue;
    }
    if (!next) {
      continue;
    }
    if (/\s/.test(next)) {
      continue;
    }
    if (ASCII_PUNCTUATION.has(next)) {
      continue;
    }
    if (ASCII_PUNCTUATION_BOUNDARY.has(next)) {
      continue;
    }
    if (isCjkPunctuation(next)) {
      continue;
    }
    if (!isSpacingCandidate(prev) || !isSpacingCandidate(next)) {
      continue;
    }
    if (char === "." && !shouldInsertPeriodSpace(prev, next)) {
      continue;
    }
    result += " ";
  }
  return result;
}

function isExampleLabel(label) {
  const candidates = collectInlineLabelCandidates(label);
  if (candidates.size === 0) {
    return false;
  }
  for (const candidate of candidates) {
    if (EXAMPLE_LABEL_TOKENS.has(candidate)) {
      return true;
    }
  }
  return false;
}

function isTranslationLabel(label) {
  const candidates = collectInlineLabelCandidates(label);
  if (candidates.size === 0) {
    return false;
  }
  for (const candidate of candidates) {
    if (TRANSLATION_LABEL_TOKENS.has(candidate)) {
      return true;
    }
  }
  return false;
}

/**
 * 背景：
 *  - 翻译需与例句共享同一列表项，但在渲染时要另起一行保持视觉层级。
 * 目的：
 *  - 继承列表缩进，避免因直接替换为空格导致的错位或视觉抖动。
 * 关键决策与取舍：
 *  - 优先复用列表标记的占位宽度；若无法识别列表，则退化为沿用原始缩进或最小两个空格。
 */
function deriveExampleTranslationIndent(prefix) {
  const listMatch = prefix.match(/^([ \t]*)(?:([-*+])|((?:\d+[.)])))(\s+)/);
  if (listMatch) {
    const [, leading = "", bullet = "", numbered = "", gap = ""] = listMatch;
    const marker = bullet || numbered;
    const visualizedMarker = marker.replace(/[^\s]/g, " ");
    return `${leading}${visualizedMarker}${gap.replace(/[^\s]/g, " ")}`;
  }
  const leadingWhitespaceMatch = prefix.match(/^[ \t]+/);
  if (leadingWhitespaceMatch) {
    return leadingWhitespaceMatch[0];
  }
  return "  ";
}

function ensureSegmentationMarkerSpacing(value) {
  let result = value;
  for (const pattern of SEGMENTATION_MARKER_PATTERNS) {
    result = result.replace(pattern, (match, offset, source) => {
      let prefix = "";
      if (offset > 0 && !/\s/.test(source[offset - 1])) {
        prefix = " ";
      }
      const end = offset + match.length;
      let suffix = "";
      const nextChar = source[end];
      if (
        end < source.length &&
        !/\s/.test(nextChar) &&
        !isCjkPunctuation(nextChar) &&
        !ASCII_PUNCTUATION.has(nextChar)
      ) {
        suffix = " ";
      }
      return `${prefix}${match}${suffix}`;
    });
  }
  return result;
}

function separateHanAndLatinTokens(value) {
  let result = value.replace(/(\p{Script=Han})([A-Za-z0-9])/gu, "$1 $2");
  result = result.replace(/([A-Za-z0-9])(\p{Script=Han})/gu, "$1 $2");
  return result;
}

/**
 * 意图：对例句正文增加分词空格，使分段标注与中英混排更加清晰。
 * 输入：例句正文文本（不含标签与冒号）。
 * 输出：经标注拆分与空格规整后的正文。
 * 流程：
 *  1) 为分词标记（[[ ]]/{{ }}/# #）补齐前后空格。
 *  2) 在汉字与拉丁字符的分界处插入空格，并压缩多余空格。
 * 错误处理：若正文为空则直接返回原值。
 * 复杂度：O(m)，m 为例句长度，仅使用常数空间。
 */
function normalizeExampleContent(value) {
  if (!value) {
    return value;
  }
  const withMarkerSpacing = ensureSegmentationMarkerSpacing(value);
  const separated = separateHanAndLatinTokens(withMarkerSpacing);
  return separated.replace(/\s{2,}/g, " ").trim();
}

/**
 * 意图：在例句正文与下一行之间解析潜在的 `#token#` 分词标记。
 * 输入：
 *  - lines：Markdown 行数组。
 *  - startIndex：疑似分词标记行的索引。
 * 输出：若解析成功返回 `{ marker, trailingText, consumed }`，否则返回 null。
 * 流程：
 *  1) 读取首行并归一化 `#` 前后的空格。
 *  2) 若首行已形成完整 `#token#`，直接返回；否则向后寻找补齐的闭合 `#`。
 *  3) 当后续行以单个 `#` 开头时，将其视为闭合标记，并把剩余正文作为 `trailingText`。
 * 错误处理：遇到多级标题（`##`）或非 `#` 开头的行即放弃解析，避免误吞标题。
 * 复杂度：O(p)，p 为尝试拼接分词标记所需行数。
 */
function parseSegmentationMarker(lines, startIndex) {
  if (startIndex >= lines.length) {
    return null;
  }
  const firstLine = lines[startIndex];
  const trimmed = firstLine.trimStart();
  if (!trimmed.startsWith("#")) {
    return null;
  }
  const normalized = trimmed.replace(/^#\s+/, "#").trimEnd();
  if (!/^#[^#\s]+/.test(normalized)) {
    return null;
  }
  let consumed = 1;
  if (/^#[^#\s]+#$/.test(normalized)) {
    return { marker: normalized, trailingText: "", consumed };
  }
  if (!/^#[^#\s]+$/.test(normalized)) {
    return null;
  }
  let gapConsumed = 0;
  for (let idx = startIndex + 1; idx < lines.length; idx += 1) {
    const candidate = lines[idx];
    const candidateTrimmed = candidate.trimStart();
    if (candidateTrimmed === "") {
      gapConsumed += 1;
      continue;
    }
    if (!candidateTrimmed.startsWith("#")) {
      return null;
    }
    if (/^##/.test(candidateTrimmed)) {
      return null;
    }
    const trailingText = candidateTrimmed.replace(/^#\s*/, "");
    return {
      marker: `${normalized}#`,
      trailingText,
      consumed: consumed + gapConsumed + 1,
    };
  }
  return null;
}

/**
 * 意图：收集例句行后续的分词标记附件，并保留需要独立渲染的标题行。
 * 输入：
 *  - lines：Markdown 行数组。
 *  - startIndex：例句下一行的索引。
 * 输出：结构体 `{ markerAttachments, preservedHeadings, consumed }`。
 * 流程：
 *  1) 跳过空行，逐行检查是否为分词标记或标题。
 *  2) 对 `#` 开头的行调用 `parseSegmentationMarker`，仅当解析成功时并入附件。
 *  3) 遇到无法解析的 `#` 行则认定为标题，终止扫描并记录待保留的标题行。
 * 错误处理：默认保守策略，未识别的行会被留给后续流程。
 * 复杂度：O(q)，q 为附件区段的行数。
 */
function collectExampleSegmentationAttachments(lines, startIndex) {
  const markerAttachments = [];
  const preservedHeadings = [];
  let consumed = 0;
  let cursor = startIndex;
  while (cursor < lines.length) {
    const current = lines[cursor];
    const trimmed = current.trimStart();
    if (trimmed === "") {
      consumed += 1;
      cursor += 1;
      continue;
    }
    if (!/^(#|\{\{|\[\[)/.test(trimmed)) {
      break;
    }
    if (trimmed.startsWith("#")) {
      const parsed = parseSegmentationMarker(lines, cursor);
      if (!parsed) {
        preservedHeadings.push(current);
        consumed += 1;
        break;
      }
      markerAttachments.push(parsed);
      consumed += parsed.consumed;
      cursor += parsed.consumed;
      continue;
    }
    markerAttachments.push({ marker: trimmed, trailingText: "" });
    consumed += 1;
    cursor += 1;
  }
  return { markerAttachments, preservedHeadings, consumed };
}

/**
 * 意图：在字典 Markdown 中定位例句行并补齐分词空格。
 * 输入：格式化前的 Markdown 字符串。
 * 输出：例句段落完成分词空格后的 Markdown。
 * 流程：
 *  1) 按行扫描，识别出包含例句标签的行。
 *  2) 对命中行的正文部分调用 `normalizeExampleContent` 进行空格规整。
 * 错误处理：对无法识别的行保持原样，确保 Markdown 不被破坏。
 * 复杂度：O(n)，n 为文本总长度。
 */
function applyExampleSegmentationSpacing(text) {
  if (!text) {
    return text;
  }
  const lines = text.split("\n");
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
    const { markerAttachments, preservedHeadings, consumed } =
      collectExampleSegmentationAttachments(lines, i + 1);
    const combined = markerAttachments.reduce((acc, attachment) => {
      return `${acc}${attachment.marker}${attachment.trailingText}`;
    }, rest);
    const normalizedContent = normalizeExampleContent(combined);
    if (!normalizedContent) {
      normalized.push(prefix.trimEnd());
    } else {
      normalized.push(`${prefix}${normalizedContent}`);
    }
    preservedHeadings.forEach((heading) => {
      normalized.push(heading);
    });
    i += consumed;
  }
  return normalized.join("\n").replace(/[ \t]+$/gm, "");
}

function ensureExampleTranslationLayout(text) {
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
    INLINE_TRANSLATION_LABEL_PATTERN.lastIndex = 0;
    let handled = false;
    while (true) {
      const translationMatch = INLINE_TRANSLATION_LABEL_PATTERN.exec(rest);
      if (!translationMatch) {
        break;
      }
      const [, rawLabel, innerLabel] = translationMatch;
      const candidate = innerLabel ?? rawLabel;
      if (!isTranslationLabel(candidate)) {
        continue;
      }
      let start = translationMatch.index;
      while (start > 0) {
        const previous = rest[start - 1];
        if (!previous) {
          break;
        }
        if (TRANSLATION_LABEL_BOUNDARY_PATTERN.test(previous)) {
          start -= 1;
          continue;
        }
        break;
      }
      const exampleBody = rest.slice(0, start).trimEnd();
      const translationSegment = rest.slice(start).trimStart();
      const exampleLine = exampleBody
        ? `${prefix}${exampleBody}`.trimEnd()
        : prefix.trimEnd();
      normalized.push(exampleLine.replace(/[ \t]+$/u, ""));
      if (translationSegment) {
        const translationIndent = deriveExampleTranslationIndent(prefix);
        normalized.push(
          `${translationIndent}${translationSegment}`.replace(/[ \t]+$/u, ""),
        );
      }
      handled = true;
      break;
    }
    if (!handled) {
      normalized.push(line);
    }
  }
  return normalized.join("\n");
}

export function polishDictionaryMarkdown(source) {
  if (!source) return "";
  const normalized = normalizeNewlines(source);
  const withHeadingsMerged = mergeBrokenHeadingLines(normalized);
  const withDelimitersRestored = restoreMissingLabelDelimiters(
    withHeadingsMerged,
  );
  const withAdjacentSeparated = separateAdjacentInlineLabels(
    withDelimitersRestored,
  );
  const withLabelBreaksNormalized = normalizeLabelBreakArtifacts(
    withAdjacentSeparated,
  );
  const expanded = expandCollapsedLabelChains(withLabelBreaksNormalized);
  const decorated = decorateBareInlineLabels(expanded);
  const separated = enforceInlineLabelBoundary(decorated);
  const spacedColon = ensureColonSpacing(separated);
  const humanizedValues = humanizeCompactMetadataValues(spacedColon);
  const withLineBreak = ensureHeadingLineBreak(humanizedValues);
  const withHeadingSpacing = ensureHeadingSpacing(withLineBreak);
  const withHeadingLists = separateHeadingListMarkers(withHeadingSpacing);
  const headingsSeparated = separateHeadingInlineLabels(withHeadingLists);
  const headingsIsolated = isolateSectionHeadingContent(headingsSeparated);
  const padded = ensureHeadingPadding(headingsIsolated);
  const spaced = ensureListSpacing(padded);
  const withInlineBreaks = ensureInlineLabelLineBreak(spaced);
  const withoutDanglingSeparators = resolveDanglingLabelSeparators(
    withInlineBreaks,
  );
  const withPunctuationSpacing = ensureEnglishPunctuationSpacing(
    withoutDanglingSeparators,
  );
  const withExampleSegmentation = applyExampleSegmentationSpacing(
    withPunctuationSpacing,
  );
  const withTranslationLayout = ensureExampleTranslationLayout(
    withExampleSegmentation,
  );
  return withTranslationLayout.replace(/[ \t]+$/gm, "");
}
