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
 * 确认当存在 markdown 字段时优先渲染其内容。
 */
test("renders top-level markdown when present", () => {
  const entry = { markdown: "# Title" };
  render(<DictionaryEntry entry={entry} />);
  const heading = screen.getByText("Title");
  expect(heading.tagName).toBe("H1");
});

/**
 * 没有 markdown 字段时回退到 definitions 渲染。
 */
test("falls back to definitions", () => {
  const entry = {
    词条: "test",
    发音解释: [{ 释义: [{ 定义: "**bold**" }] }],
  };
  render(<DictionaryEntry entry={entry} />);
  const strong = screen.getByText("bold");
  expect(strong.tagName).toBe("STRONG");
});
