import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";

const streamWordMock = jest.fn();
const apiMock = { words: { streamWord: streamWordMock } };

jest.unstable_mockModule("../useApi.js", () => ({
  useApi: () => apiMock,
}));

jest.unstable_mockModule("@/context", () => ({
  useLanguage: () => ({
    t: {
      playWordAudio: "",
      playSentenceAudio: "",
      upgrade: "",
    },
    lang: "en",
  }),
}));

jest.unstable_mockModule("@/components", () => ({
  TtsButton: () => null,
  PronounceableWord: ({ children }) => <span>{children}</span>,
}));

const { default: DictionaryEntry } = await import(
  "../../components/ui/DictionaryEntry/DictionaryEntry.jsx"
);
const { useStreamWord } = await import("../useStreamWord.js");
const { useWordStore } = await import("../../store/wordStore.js");

beforeEach(() => {
  streamWordMock.mockReset();
  useWordStore.getState().clear();
});

/**
 * 测试逻辑:
 *  1. 模拟 API 返回纯 JSON 结果。
 *  2. 调用流式函数并等待完成。
 *  3. 断言缓存内容不含 markdown 且渲染释义。
 */
test("cache JSON entry and render definitions", async () => {
  const jsonEntry = JSON.parse(
    '{ "词条": "test", "发音解释": [{ "释义": [{ "定义": "**bold**" }] }] }',
  );

  streamWordMock.mockImplementation(async function* () {
    yield { type: "chunk", data: JSON.stringify(jsonEntry) };
  });

  const streamWordWithHandling = useStreamWord();
  for await (const _ of streamWordWithHandling({
    user: { id: "u", token: "t" },
    term: "test",
    signal: new AbortController().signal,
  })) {
    // consume generator
  }

  const record = useWordStore
    .getState()
    .getRecord(Object.keys(useWordStore.getState().entries)[0]);
  expect(record.versions[0]).toMatchObject(jsonEntry);
  expect(record.versions[0].markdown).toBeUndefined();

  render(<DictionaryEntry entry={record.versions[0]} />);
  const strong = screen.getByText("bold");
  expect(strong.tagName).toBe("STRONG");
});

/**
 * 测试逻辑:
 *  1. 模拟 API 返回纯 Markdown 内容。
 *  2. 调用流式函数并等待完成。
 *  3. 断言缓存含 markdown 字段且能渲染。
 */
test("cache markdown entry and render", async () => {
  streamWordMock.mockImplementation(async function* () {
    yield { type: "chunk", data: "# Title" };
  });

  const streamWordWithHandling = useStreamWord();
  for await (const _ of streamWordWithHandling({
    user: { id: "u", token: "t" },
    term: "test",
    signal: new AbortController().signal,
  })) {
    // consume generator
  }

  const record = useWordStore
    .getState()
    .getRecord(Object.keys(useWordStore.getState().entries)[0]);
  expect(record.versions[0].markdown).toBe("# Title");

  render(<DictionaryEntry entry={record.versions[0]} />);
  const heading = screen.getByText("Title");
  expect(heading.tagName).toBe("H1");
});
