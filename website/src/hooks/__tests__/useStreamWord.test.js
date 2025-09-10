import { render, screen } from "@testing-library/react";
import DictionaryEntry from "@/components/ui/DictionaryEntry";
import { useStreamWord } from "@/hooks/useStreamWord";
import { useWordStore } from "@/store/wordStore.js";

const streamWordMock = jest.fn();
const apiMock = { words: { streamWord: streamWordMock } };
jest.mock("@/hooks/useApi.js", () => ({
  useApi: () => apiMock,
}));

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
    yield JSON.stringify(jsonEntry);
  });

  const streamWordWithHandling = useStreamWord();
  for await (const _ of streamWordWithHandling({
    user: { id: "u", token: "t" },
    term: "test",
    signal: new AbortController().signal,
  })) {
    // consume generator
  }

  const entries = useWordStore.getState().entries;
  const cached = entries[Object.keys(entries)[0]];
  expect(cached).toEqual(jsonEntry);
  expect(cached.markdown).toBeUndefined();

  render(<DictionaryEntry entry={cached} />);
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
    yield "# Title";
  });

  const streamWordWithHandling = useStreamWord();
  for await (const _ of streamWordWithHandling({
    user: { id: "u", token: "t" },
    term: "test",
    signal: new AbortController().signal,
  })) {
    // consume generator
  }

  const entries = useWordStore.getState().entries;
  const cached = entries[Object.keys(entries)[0]];
  expect(cached.markdown).toBe("# Title");

  render(<DictionaryEntry entry={cached} />);
  const heading = screen.getByText("Title");
  expect(heading.tagName).toBe("H1");
});
