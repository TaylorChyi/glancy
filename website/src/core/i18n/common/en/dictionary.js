/**
 * 背景：
 *  - 词典与检索相关词条在原文件内篇幅庞大，影响整体可读性。
 * 目的：
 *  - 独立维护词典、搜索、收藏及历史模块用语，支撑后续按领域演进。
 * 关键决策与取舍：
 *  - 采用对象组合聚合多个子场景（搜索、收藏、版本），以清晰命名表达语义；
 *  - 保持键名稳定，避免影响既有渲染逻辑。
 * 影响范围：
 *  - 字典搜索、收藏历史与版本切换界面。
 * 演进与TODO：
 *  - 可在未来引入多语言词条校验脚本，确保模块内键名一致。
 */
const dictionary = {
  autoDetect: "Auto Detect",
  dictionarySourceLanguageLabel: "Source language",
  dictionarySourceLanguageAuto: "Auto detect",
  dictionarySourceLanguageAutoDescription:
    "Glancy senses the term language and chooses the proper dictionary automatically.",
  dictionarySourceLanguageEnglish: "English",
  dictionarySourceLanguageEnglishDescription:
    "Treat the input as English and unlock full tooling for English entries.",
  dictionarySourceLanguageChinese: "Chinese",
  dictionarySourceLanguageChineseDescription:
    "Treat the input as Chinese and surface Chinese-first experiences.",
  dictionarySwapLanguages: "Swap languages",
  dictionaryTargetLanguageLabel: "Target language",
  dictionaryTargetLanguageEnglish: "English",
  dictionaryTargetLanguageEnglishDescription:
    "Deliver detailed explanations in English, ideal for immersive reading.",
  dictionaryTargetLanguageChinese: "Chinese",
  dictionaryTargetLanguageChineseDescription:
    "Provide elegant Chinese interpretations tailored for precise translation.",
  searchTitle: "Word Search",
  searchButton: "Search",
  searchPlaceholder: "What are we querying next?",
  inputPlaceholder: "Words, phrases, sentences",
  primaryNavDictionaryLabel: "Glancy",
  primaryNavDictionaryDescription: "Immersive lexical intelligence",
  primaryNavLibraryLabel: "Goyoo",
  primaryNavLibraryDescription: "Your private word atelier",
  primaryNavEntriesLabel: "Entries",
  termLabel: "Term",
  playAudio: "Play",
  playWordAudio: "Play pronunciation",
  playSentenceAudio: "Play example audio",
  phoneticLabel: "Phonetic",
  languageLabel: "Language",
  definitionsLabel: "Definitions",
  exampleLabel: "Example",
  synonymsLabel: "Synonyms",
  antonymsLabel: "Antonyms",
  relatedLabel: "Related",
  variantsLabel: "Variants",
  phrasesLabel: "Phrases",
  favorites: "Favorites",
  favoritesIconAlt: "Open favorites collection",
  favoriteAction: "Favorite",
  favoriteRemove: "Remove from favorites",
  favoritesEmptyTitle: "Curate your first favorite",
  favoritesEmptyDescription:
    "Tap the star on any search result to build your personal lexicon.",
  favoritesEmptyAction: "Return to search",
  searchHistory: "History",
  noFavorites: "No favorites yet",
  noHistory: "No history",
  historyEmptyTitle: "Your story starts here",
  historyEmptyDescription:
    "Recent lookups will settle here for quick revisits once you begin exploring.",
  historyEmptyAction: "Back to discovery",
  searchEmptyTitle: "Awaiting your next curiosity",
  searchEmptyDescription:
    "Enter a term, phrase, or sentence to let Glancy compose tailored insights.",
  searchEmptyAction: "Focus search",
  noDefinition: "No definition",
  clearHistory: "Clear History",
  deleteAction: "Delete",
  reoutput: "Regenerate",
  previousVersion: "Previous version",
  nextVersion: "Next version",
  versionIndicator: "{current} / {total}",
  versionIndicatorEmpty: "No versions",
};

export default dictionary;
