const createBaseEntry = () => ({
  id: "entry-1",
  term: "mock",
  language: "ENGLISH",
  flavor: "BILINGUAL",
  preview: "mock preview",
  markdown: "### mock\n\n> definition placeholder",
  phonetics: [
    {
      id: "phon-1",
      symbol: "/mɒk/",
      audioUrl: "/audio/mock.mp3",
    },
  ],
  definitions: [
    {
      id: "definition-1",
      lexicalEntry: "mock (n.)",
      explanation: "placeholder explanation",
      sourceLanguage: "ENGLISH",
      targetLanguage: "CHINESE",
      translations: [
        {
          id: "translation-1",
          text: "示例",
          explanation: "translation placeholder",
        },
      ],
      examples: [
        {
          id: "example-1",
          sentence: "This is a mock example.",
          translation: "这是一个示例句子。",
        },
      ],
    },
  ],
  related: [],
  tags: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
});

/**
 * Builds a dictionary entry fixture with ergonomic overrides for verbose tests.
 * @param {Partial<ReturnType<typeof createBaseEntry>>} overrides
 * @returns {ReturnType<typeof createBaseEntry>}
 */
export function makeEntry(overrides = {}) {
  return {
    ...createBaseEntry(),
    ...overrides,
  };
}

export default makeEntry;
