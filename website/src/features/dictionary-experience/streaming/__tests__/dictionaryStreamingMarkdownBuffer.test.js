import { createDictionaryStreamingMarkdownBuffer } from "../dictionaryStreamingMarkdownBuffer.js";

/**
 * 测试目标：纯 Markdown 流需逐步更新预览并在 finalize 时返回最终文本。
 * 前置条件：缓冲器接收两段 markdown chunk。
 * 步骤：依次 append 并读取返回值，最终调用 finalize。
 * 断言：
 *  - 每次 append 返回最新预览；
 *  - finalize 返回完整 Markdown；
 *  - entry 始终为空。
 */
test("GivenMarkdownChunks_WhenAppended_ShouldExposeNormalizedPreview", () => {
  const buffer = createDictionaryStreamingMarkdownBuffer();
  const first = buffer.append("# Ti");
  expect(first.preview).toBe("# Ti");
  expect(first.entry).toBeNull();

  const second = buffer.append("tle");
  expect(second.preview).toBe("# Title");
  expect(second.entry).toBeNull();

  const { markdown, entry } = buffer.finalize();
  expect(markdown).toBe("# Title");
  expect(entry).toBeNull();
});

/**
 * 测试目标：JSON 词条在解析成功后应生成结构化 Markdown，并透出 entry。
 * 前置条件：缓冲器追加完整 JSON 串。
 * 步骤：append 后直接 finalize。
 * 断言：
 *  - append 返回的 preview 不为空；
 *  - entry 为对象且含有 markdown 字段；
 *  - finalize 输出与 append 预览一致。
 */
test("GivenJsonEntry_WhenAppended_ShouldProduceMarkdownAndEntry", () => {
  const payload = {
    markdown: "## 释义\n1. example",
    term: "demo",
  };
  const buffer = createDictionaryStreamingMarkdownBuffer();
  const { preview, entry } = buffer.append(JSON.stringify(payload));
  expect(preview).toContain("## 释义");
  expect(entry).not.toBeNull();
  expect(entry.markdown).toContain("## 释义");
  expect(entry.markdown).toContain("example");

  const final = buffer.finalize();
  expect(final.markdown).toBe(preview);
  expect(final.entry.markdown).toContain("## 释义");
});
