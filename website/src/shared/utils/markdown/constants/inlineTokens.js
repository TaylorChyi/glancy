/**
 * 背景：
 *  - 行内标签跨多语言与业务模块，需要统一词表与动态匹配规则。
 * 目的：
 *  - 暴露行内标签相关的词表、动态模式与终止符集合。
 */
export const INLINE_LABEL_TERMINATORS = new Set([
  "]",
  "}",
  ")",
  "\u3009", // 〉
  "\u300B", // 》
  "\u3011", // 】
  "\u3015", // 〕
  "\u3017", // 〗
  "\uFF3D", // ］
]);

export const INLINE_LABEL_TOKENS = new Set(
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
    "answer",
    "practiceprompts",
    "sentencecorrection",
    "contextualtranslation",
    "subsense",
    "subsenses",
  ].map((token) => token.toLowerCase()),
);

export const INLINE_LABEL_DYNAMIC_PATTERNS = [
  /^(?:s|sense)\d+(?:[a-z]+\d*)*$/,
  /^example\d+$/,
  /^practiceprompts\d+(?:[a-z]+)?$/,
];
