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
  useKeyboardShortcutContext: () => ({
    register: () => {},
    unregister: () => {},
  }),
  useTheme: () => ({ mode: "light" }),
  useUser: () => ({ user: { id: "tester" } }),
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
const { useDataGovernanceStore } = await import("../../store/dataGovernanceStore.ts");

beforeEach(() => {
  streamWordMock.mockReset();
  useWordStore.getState().clear();
  useDataGovernanceStore.setState({ historyCaptureEnabled: true });
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

  expect(streamWordMock).toHaveBeenCalledWith(
    expect.objectContaining({ language: "ENGLISH", captureHistory: true }),
  );

  const record = useWordStore
    .getState()
    .getRecord(Object.keys(useWordStore.getState().entries)[0]);
  expect(record.versions[0]).toMatchObject(jsonEntry);
  expect(record.versions[0].markdown).toBeUndefined();

  render(<DictionaryEntry entry={record.versions[0]} />);
  const strong = screen.getByText((_, element) => element.tagName === "STRONG");
  expect(strong.textContent.replace(/\u200b/g, "")).toBe("bold");
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

  expect(streamWordMock).toHaveBeenCalledWith(
    expect.objectContaining({ language: "ENGLISH", captureHistory: true }),
  );

  const record = useWordStore
    .getState()
    .getRecord(Object.keys(useWordStore.getState().entries)[0]);
  expect(record.versions[0].markdown).toBe("# Title");

  render(<DictionaryEntry entry={record.versions[0]} />);
  const heading = screen.getByText("Title");
  expect(heading.tagName).toBe("H1");
});

/**
 * 测试目标：确保流式查询在禁用历史采集时传递 captureHistory=false。\
 * 前置条件：historyCaptureEnabled 设为 false。\
 * 步骤：\
 *  1) 启动模拟流式返回。\
 *  2) 调用 useStreamWord 并消费生成器。\
 * 断言：\
 *  - API 入参包含 captureHistory=false。\
 * 边界/异常：覆盖禁用采集的分支。\
 */
test("streamWord forwards captureHistory preference", async () => {
  useDataGovernanceStore.setState({ historyCaptureEnabled: false });
  streamWordMock.mockImplementation(async function* () {
    yield { type: "chunk", data: "{}" };
  });

  const streamWordWithHandling = useStreamWord();
  for await (const _ of streamWordWithHandling({
    user: { id: "u", token: "t" },
    term: "test",
    signal: new AbortController().signal,
  })) {
    // consume
  }

  expect(streamWordMock).toHaveBeenCalledWith(
    expect.objectContaining({ captureHistory: false }),
  );
});
