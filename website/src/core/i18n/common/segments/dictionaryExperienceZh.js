/**
 * 背景：
 *  - 词典体验相关的翻译项数量庞大，需要独立分组以支撑功能扩展。
 * 目的：
 *  - 将查词流程、收藏、历史等文案统一集中，确保演进时上下文一致。
 * 关键决策与取舍：
 *  - 不调整现有键名，维持调用端无感迁移；
 *  - 覆盖搜索、收藏、语言切换及占位提示，构建完整链路。
 * 影响范围：
 *  - 词典页面、收藏夹与历史记录组件。
 * 演进与TODO：
 *  - 若引入多模态释义，可在此扩展媒体类型相关文案。
 */
export const DICTIONARY_EXPERIENCE_TRANSLATIONS_ZH = {
  dictionarySourceLanguageLabel: "源语言",
  dictionarySourceLanguageAuto: "自动识别",
  dictionarySourceLanguageAutoDescription:
    "智能侦测输入语种，自动匹配最合适的词典体验。",
  dictionarySourceLanguageEnglish: "英文",
  dictionarySourceLanguageEnglishDescription:
    "按英文单词处理，启用完整的英文输入配套能力。",
  dictionarySourceLanguageChinese: "中文",
  dictionarySourceLanguageChineseDescription:
    "按中文词语理解，优先呈现中文语境中的重点。",
  dictionarySwapLanguages: "交换语向",
  dictionaryTargetLanguageLabel: "目标语言",
  dictionaryTargetLanguageEnglish: "英文",
  dictionaryTargetLanguageEnglishDescription:
    "提供纯英文解释与例句，适合沉浸式阅读。",
  dictionaryTargetLanguageChinese: "中文",
  dictionaryTargetLanguageChineseDescription:
    "输出优雅细腻的中文解读，满足精准翻译需求。",
  searchTitle: "词汇查询",
  searchButton: "搜索",
  primaryNavDictionaryLabel: "格律词典",
  primaryNavDictionaryDescription: "沉浸式灵感解读",
  primaryNavLibraryLabel: "致用单词",
  primaryNavLibraryDescription: "私享收藏集",
  primaryNavEntriesLabel: "词条",
  termLabel: "词条",
  playAudio: "播放语音",
  phoneticLabel: "读音",
  languageLabel: "语言",
  definitionsLabel: "释义",
  exampleLabel: "例句",
  synonymsLabel: "同义词",
  antonymsLabel: "反义词",
  relatedLabel: "相关词",
  variantsLabel: "变形",
  phrasesLabel: "常见词组",
  favorites: "收藏夹",
  favoritesIconAlt: "打开收藏夹",
  searchHistory: "搜索记录",
  noDefinition: "暂无释义",
  noFavorites: "暂无收藏",
  noHistory: "暂无记录",
  favoritesEmptyTitle: "收藏夹静候佳作",
  favoritesEmptyDescription: "为任意词条点亮星标，打造只属于你的高定词汇清单。",
  favoritesEmptyAction: "返回搜索",
  historyEmptyTitle: "历史记录尚未启航",
  historyEmptyDescription:
    "当你开始探索，最近的检索会在这里井然排列，随时回味。",
  historyEmptyAction: "回到搜索",
  searchEmptyTitle: "静候你的下一次好奇",
  searchEmptyDescription: "输入词条、短语或句子，格律词典将为你呈现专属解读。",
  searchEmptyAction: "聚焦搜索框",
  clearHistory: "清空记录",
  searchPlaceholder: "接下来查询什么？",
  inputPlaceholder: "词条、短语、句子",
  playWordAudio: "播放发音",
  playSentenceAudio: "播放例句发音",
  deleteAction: "删除",
};
