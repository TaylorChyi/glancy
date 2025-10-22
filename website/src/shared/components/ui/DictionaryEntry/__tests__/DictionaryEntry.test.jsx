import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";

jest.unstable_mockModule("remark-gfm", () => ({
  default: () => {},
}));

jest.unstable_mockModule("@core/context", () => ({
  __esModule: true,
  ThemeContext: { Provider: ({ children }) => children },
  ThemeProvider: ({ children }) => children,
  useTheme: () => ({ theme: "light" }),
  LocaleContext: { Provider: ({ children }) => children },
  useLocale: () => ({ locale: { lang: "zh" } }),
  ApiContext: { Provider: ({ children }) => children },
  ApiProvider: ({ children }) => children,
  useApiContext: () => ({}),
  AppContext: { Provider: ({ children }) => children },
  AppProvider: ({ children }) => children,
  useUser: () => ({}),
  useHistory: () => ({}),
  useFavorites: () => ({}),
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
  useKeyboardShortcutContext: () => ({
    register: () => {},
    unregister: () => {},
  }),
  KeyboardShortcutProvider: ({ children }) => children,
  KEYBOARD_SHORTCUT_RESET_ACTION: "__RESET__",
}));

jest.unstable_mockModule("@shared/components", () => ({
  __esModule: true,
  TtsButton: () => null,
  PronounceableWord: ({ text }) => <span>{text}</span>,
}));

const { default: DictionaryEntry } = await import("@shared/components/ui/DictionaryEntry");

const getStrongText = (expected) =>
  screen.getByText((_, element) => {
    if (!element || element.tagName !== "STRONG") return false;
    return element.textContent.replace(/\u200B/g, "") === expected;
  });

/**
 * 确认当存在 markdown 字段且为 Markdown 文本时优先渲染。
 */
test("renders top-level markdown when present", () => {
  const entry = { markdown: "# Title" };
  render(<DictionaryEntry entry={entry} />);
  const heading = screen.getByText("Title");
  expect(heading.tagName).toBe("H1");
});

/**
 * 确认当 markdown 字段为 JSON 字符串时解析并渲染结构化内容。
 */
test("renders structured data from JSON markdown", () => {
  const entry = {
    markdown: JSON.stringify({
      词条: "test",
      发音解释: [{ 释义: [{ 定义: "**bold**" }] }],
    }),
  };
  render(<DictionaryEntry entry={entry} />);
  const strong = getStrongText("bold");
  expect(strong.tagName).toBe("STRONG");
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
  const strong = getStrongText("bold");
  expect(strong.tagName).toBe("STRONG");
});

/**
 * 组件应当忽略个性化字段，保持核心结构渲染稳定。
 */
test("ignores personalization payload gracefully", () => {
  const entry = {
    personalization: {
      personaSummary: "curious learner",
    },
    definitions: ["definition"],
  };
  render(<DictionaryEntry entry={entry} />);
  expect(screen.queryByText("curious learner")).not.toBeInTheDocument();
  expect(screen.getByText("definition")).toBeInTheDocument();
});

/**
 * 测试目标：旧版结构的章节标题不再包含全角书名号装饰符。
 * 前置条件：模拟 legacy 数据结构，提供基础翻译与例句。
 * 步骤：
 *  1) 渲染仅含发音、释义、例句的旧版词条；
 *  2) 检索章节标题文本内容。
 * 断言：
 *  - 标题文本为翻译文案本身，不含“【】”字符；
 * 边界/异常：
 *  - 若翻译文案为空，应回退到无标题，此处不覆盖。
 */
test("legacy headings omit decorative brackets", () => {
  const entry = {
    phonetic: "pin",
    definitions: ["definition"],
    example: "sample sentence",
  };

  render(<DictionaryEntry entry={entry} />);

  expect(screen.getByRole("heading", { name: "phon" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "defs" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "ex" })).toBeInTheDocument();
  expect(screen.queryByText("【phon】")).not.toBeInTheDocument();
  expect(screen.queryByText("【defs】")).not.toBeInTheDocument();
  expect(screen.queryByText("【ex】")).not.toBeInTheDocument();
});

/**
 * 测试目标：新版结构的各章节标题同样去除全角括号标记。
 * 前置条件：提供含发音、释义与常见词组的结构化词条。
 * 步骤：
 *  1) 渲染新版词条；
 *  2) 检索多段标题并验证文本。
 * 断言：
 *  - 所有标题均直接呈现文案，不包含“【】”装饰；
 * 边界/异常：
 *  - 当翻译文案缺失时标题本就不渲染，此处不覆盖。
 */
test("structured entry headings omit decorative brackets", () => {
  const entry = {
    词条: "测试",
    发音: { 英音: "test", 美音: "tɛst" },
    发音解释: [
      {
        释义: [
          {
            定义: "definition",
            例句: [{ 源语言: "Example", 翻译: "示例" }],
          },
        ],
      },
    ],
    常见词组: ["phrase"],
  };

  render(<DictionaryEntry entry={entry} />);

  expect(screen.getByRole("heading", { name: "phon" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "defs" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "phr" })).toBeInTheDocument();
  expect(screen.queryByText(/【/)).not.toBeInTheDocument();
});
