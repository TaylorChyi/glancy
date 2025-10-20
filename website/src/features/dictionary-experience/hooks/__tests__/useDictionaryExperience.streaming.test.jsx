/**
 * 背景：
 *  - 历史实现假设流式 chunk 恒为 JSON，导致当后端返回纯 Markdown 文本时直接 JSON.parse 抛错。
 * 目的：
 *  - 验证新版查询链路能兼容纯文本片段，确保流式预览与最终结果都能稳定落地。
 * 关键决策与取舍：
 *  - 复用统一的测试 harness，聚焦 streaming 逻辑，避免重建上下文；
 *  - 断言预览与最终文本一致，证明缓冲器在无 JSON 的场景仍能工作。
 * 影响范围：
 *  - useDictionaryExperience 在处理字典查询时的流式渲染体验。
 * 演进与TODO：
 *  - 后续可追加含 metadata 事件的流式回归用例，覆盖更多协议分支。
 */

import { renderHook, act } from "@testing-library/react";
import {
  useDictionaryExperience,
  mockStreamWord,
  createStreamFromChunks,
  resetDictionaryExperienceTestState,
} from "../testing/useDictionaryExperienceTestHarness.js";

/**
 * 测试目标：纯文本 chunk 应被缓冲器接受并生成流式/最终 Markdown。
 * 前置条件：mockStreamWord 依次推送两个 Markdown 片段且无 JSON 包裹。
 * 步骤：
 *  1) 渲染 useDictionaryExperience；
 *  2) 设置查询词并触发 handleSend；
 *  3) 等待异步流程完成。
 * 断言：
 *  - streamText 与 finalText 均等于拼接后的 Markdown；
 *  - 查询结束后 loading 复位，避免残留。
 * 边界/异常：
 *  - 若缓冲器仍要求 JSON，将抛出异常导致测试失败。
 */
it("GivenPlainTextChunks_WhenLookupExecutes_ThenBuffersMarkdownPreview", async () => {
  resetDictionaryExperienceTestState();

  const markdownFragments = ["## 简介\n", "逐字流式内容"];
  mockStreamWord.mockImplementation(() =>
    createStreamFromChunks(
      { chunk: markdownFragments[0], language: "CHINESE" },
      { chunk: markdownFragments[1], language: "CHINESE" },
    ),
  );

  const { result } = renderHook(() => useDictionaryExperience());

  await act(async () => {
    result.current.setText("测试");
  });

  await act(async () => {
    await result.current.handleSend({ preventDefault: () => {} });
  });

  const expectedMarkdown = markdownFragments.join("");
  expect(result.current.streamText).toBe(expectedMarkdown);
  expect(result.current.finalText).toBe(expectedMarkdown);
  expect(result.current.loading).toBe(false);
});

/**
 * 测试目标：对象形态的 chunk 应解析 value/markdown 字段并生成词条。
 * 前置条件：mockStreamWord 依次推送 value 与 markdown 字段的对象。
 * 步骤：
 *  1) 渲染 useDictionaryExperience；
 *  2) 设置查询词并触发 handleSend；
 *  3) 等待异步流程完成。
 * 断言：
 *  - streamText/finalText 与 markdown 字段一致；
 *  - entry.term 与 markdown 一致，证明解释器返回词条。
 * 边界/异常：
 *  - 若解析失败将导致 entry 为空，测试随即失败。
 */
it("GivenChunkObjects_WhenLookupExecutes_ThenInterpreterExtractsValueAndEntry", async () => {
  resetDictionaryExperienceTestState();

  const chunkObjects = [
    { chunk: { value: "## 对象片段\n" }, language: "CHINESE" },
    {
      chunk: {
        term: "对象片段",
        markdown: "## 对象片段\n详解",
        versionId: "v1",
      },
      language: "CHINESE",
    },
  ];

  mockStreamWord.mockImplementation(() =>
    createStreamFromChunks(...chunkObjects),
  );

  const { result } = renderHook(() => useDictionaryExperience());

  await act(async () => {
    result.current.setText("对象片段");
  });

  await act(async () => {
    await result.current.handleSend({ preventDefault: () => {} });
  });

  const expectedMarkdown = chunkObjects[1].chunk.markdown;
  expect(result.current.streamText).toBe(expectedMarkdown);
  expect(result.current.finalText).toBe(expectedMarkdown);
  expect(result.current.entry?.term).toBe("对象片段");
  expect(result.current.loading).toBe(false);
});
