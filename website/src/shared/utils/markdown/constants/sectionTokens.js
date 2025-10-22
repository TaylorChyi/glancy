/**
 * 背景：
 *  - 章节标题需要与正文拆分，为此需维护受控词表与列表标题映射。
 * 目的：
 *  - 暴露章节相关词表，供标题策略模块消费。
 */
export const SECTION_HEADING_TOKENS = new Set(
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

export const SECTION_HEADING_TOKENS_DESC = Object.freeze(
  Array.from(SECTION_HEADING_TOKENS).sort((a, b) => b.length - a.length),
);

export const HEADING_LIST_TITLES = new Set(
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
    "词源",
    "相关派生词",
    "词根与构词法",
    "历史语义演变",
    "专业领域用法",
  ].map((title) => title.replace(/\s+/g, "")),
);
