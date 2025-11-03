/**
 * 背景：
 *  - 历史记录回放在缓存未命中时默认走流式接口，既浪费资源也造成接口错用。
 * 目的：
 *  - 验证新策略会优先使用 REST 查询，确保历史回放命中普通接口。
 * 关键决策与取舍：
 *  - 通过 test harness 注入依赖，聚焦于查询分支的选择，不涉及 UI。
 * 影响范围：
 *  - useDictionaryExperience 在历史项选择时的查询链路。
 */
import { renderHook, act } from "@testing-library/react";
import {
  useDictionaryExperience,
  mockStreamWord,
  mockFetchWordWithHandling,
  mockHistoryApi,
  mockGetRecord,
  mockGetEntry,
  resetDictionaryExperienceTestState,
  restoreDictionaryExperienceTimers,
} from "../testing/useDictionaryExperienceTestHarness.js";

describe("useDictionaryExperience/history fetch", () => {
  beforeEach(() => {
    resetDictionaryExperienceTestState();
  });

  afterEach(() => {
    restoreDictionaryExperienceTimers();
  });

  /**
   * 测试目标：历史命中缓存缺失时应触发 REST 查询且不会调用流式接口。
   * 前置条件：word store 初始无记录，fetchWordWithHandling 返回单版本词条。
   * 步骤：
   *  1) 准备历史列表包含 rest-term；
   *  2) 渲染 useDictionaryExperience 并调用 handleSelectHistory；
   * 断言：
   *  - fetchWordWithHandling 被调用一次；
   *  - streamWord 未被调用；
   *  - 最终释义与版本来源于 REST 响应。
   * 边界/异常：
   *  - 若仍触发流式接口则说明策略回退失败。
   */
  it("GivenHistoryMiss_WhenSelectingItem_ThenFetchesViaRestEndpoint", async () => {
    const restEntry = { id: "v1", term: "rest-term", markdown: "rest definition" };
    const restRecord = { entry: restEntry };
    mockHistoryApi.history = [
      { term: "rest-term", language: "ENGLISH", flavor: "default" },
    ];
    mockGetRecord
      .mockImplementationOnce(() => null)
      .mockImplementation(() => restRecord);
    mockGetEntry.mockImplementation(() => restEntry);
    mockFetchWordWithHandling.mockResolvedValue({
      data: restEntry,
      error: null,
      language: "ENGLISH",
      flavor: "default",
    });

    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      await result.current.handleSelectHistory("rest-term");
    });

    await act(async () => {});

    expect(mockFetchWordWithHandling).toHaveBeenCalledTimes(1);
    expect(mockStreamWord).not.toHaveBeenCalled();
    expect(result.current.finalText).toBe("rest definition");
    expect(result.current.entry?.term).toBe("rest-term");
    expect(result.current.loading).toBe(false);
  });
});
