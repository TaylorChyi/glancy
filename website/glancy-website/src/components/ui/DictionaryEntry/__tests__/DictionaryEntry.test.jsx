import { render, screen } from "@testing-library/react";
jest.mock("remark-gfm", () => () => {});
import DictionaryEntry from "@/components/ui/DictionaryEntry";

jest.mock("@/context", () => ({
  useLanguage: () => ({
    t: {
      phoneticLabel: "phon",
      definitionsLabel: "defs",
      noDefinition: "none",
      exampleLabel: "ex",
      synonymsLabel: "syn",
      antonymsLabel: "ant",
      relatedLabel: "rel",
      variantsLabel: "var",
      phrasesLabel: "phr",
    },
    lang: "en",
  }),
}));

jest.mock("@/components", () => ({
  TtsButton: () => null,
  PronounceableWord: ({ text }) => <span>{text}</span>,
}));

/**
 * 确认 DictionaryEntry 能解析释义中的 Markdown。
 */
test("renders markdown in definitions", () => {
  const entry = {
    词条: "test",
    发音解释: [{ 释义: [{ 定义: "**bold**" }] }],
  };
  render(<DictionaryEntry entry={entry} />);
  const strong = screen.getByText("bold");
  expect(strong.tagName).toBe("STRONG");
});
