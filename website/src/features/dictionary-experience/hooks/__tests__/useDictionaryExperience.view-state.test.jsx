/**
 * 背景：
 *  - 词典视图状态涉及版本缓存、侧栏切换与查询重置，拆分测试有助于聚焦界面行为。
 * 目的：
 *  - 验证版本切换、视图切换以及返回首页时的状态清理逻辑。
 * 关键决策与取舍：
 *  - 复用共享 harness 提供的 store mock，减少重复装配；
 *  - 将与 UI 态相关的测试集中在同一文件，便于未来演进。
 * 影响范围：
 *  - 覆盖字典操作栏的版本选择及视图切换行为。
 * 演进与TODO：
 *  - 后续可补充移动端布局、夜间模式等特化场景。
 */
import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import {
  useDictionaryExperience,
  mockStreamWord,
  mockSetActiveVersion,
  mockWordStoreState,
  mockGetRecord,
  mockGetEntry,
  createStreamFromChunks,
  resetDictionaryExperienceTestState,
  restoreDictionaryExperienceTimers,
} from "../testing/useDictionaryExperienceTestHarness.js";

/**
 * 意图：执行词条查询，统一封装 setText + handleSend 操作。
 * 输入：result 为 Hook 渲染结果，term 为查询词。
 * 输出：无返回值，等待查询完成。
 * 流程：依次调用 setText 与 handleSend。
 * 错误处理：异常交由测试捕获。
 * 复杂度：O(1)。
 */
const runLookup = async (result, term) => {
  await act(async () => {
    result.current.setText(term);
  });

  await act(async () => {
    await result.current.handleSend({ preventDefault: jest.fn() });
  });
};

/**
 * 意图：构建包含多个版本的查询场景，返回渲染结果与缓存键。
 * 输入：entryV1、entryV2 分别表示两个版本。
 * 输出：返回 { result, cacheKey }，便于后续断言。
 * 流程：
 *  1) 通过 mockStreamWord 注入双版本数据；
 *  2) 配置 mockGetRecord/mockGetEntry；
 *  3) 渲染 Hook 并触发查询。
 * 错误处理：异常由测试捕获。
 * 复杂度：O(1)。
 */
const prepareVersionSelectionScenario = async ({ entryV1, entryV2 }) => {
  mockStreamWord.mockImplementation(({ term, language }) => {
    const cacheKey = `${term}-${language}`;
    mockWordStoreState.entries = {
      ...mockWordStoreState.entries,
      [cacheKey]: {
        versions: [entryV1, entryV2],
        activeVersionId: entryV1.id,
      },
    };
    return createStreamFromChunks({
      chunk: JSON.stringify({
        ...entryV1,
        versions: [entryV1, entryV2],
        activeVersionId: entryV1.id,
      }),
      language: "ENGLISH",
    });
  });
  mockGetRecord.mockImplementation((key) => mockWordStoreState.entries[key]);
  mockGetEntry.mockImplementation((key, versionId) => {
    const record = mockWordStoreState.entries[key];
    return (
      record?.versions.find(
        (candidate) => String(candidate.id) === String(versionId),
      ) ?? null
    );
  });

  const { result } = renderHook(() => useDictionaryExperience());
  await runLookup(result, entryV1.term);

  return { result, cacheKey: `${entryV1.term}-ENGLISH` };
};

/**
 * 意图：构造单版本词条场景，便于验证 handleShowDictionary 重置逻辑。
 * 输入：entry 为缓存词条对象。
 * 输出：返回渲染结果。
 * 流程：mock 对应存储与流式数据后执行查询。
 * 错误处理：异常向上抛出。
 * 复杂度：O(1)。
 */
const prepareSingleEntryScenario = async (entry) => {
  const record = { versions: [entry], activeVersionId: entry.id };
  mockGetRecord.mockReturnValue(record);
  mockGetEntry.mockImplementation(() => entry);
  mockStreamWord.mockImplementation(() =>
    createStreamFromChunks({
      chunk: JSON.stringify(entry),
      language: "ENGLISH",
    }),
  );

  const { result } = renderHook(() => useDictionaryExperience());
  await runLookup(result, entry.term);
  return result;
};

/**
 * 意图：复用多项状态断言，降低测试内重复代码。
 * 输入：result 为 Hook 渲染结果，snapshot 描述预期。
 * 输出：无，断言失即抛错。
 * 流程：依次校验版本数量、激活版本、词条与文本内容。
 * 错误处理：依赖 Jest 断言。
 * 复杂度：O(1)。
 */
const expectDictionarySnapshot = (
  result,
  {
    versionsLength,
    activeVersionId,
    entryId,
    finalText,
    streamText,
  },
) => {
  if (typeof versionsLength === "number") {
    expect(result.current.dictionaryActionBarProps.versions).toHaveLength(
      versionsLength,
    );
  }
  if (activeVersionId !== undefined) {
    expect(result.current.dictionaryActionBarProps.activeVersionId).toBe(
      activeVersionId,
    );
  }
  if (entryId !== undefined) {
    expect(result.current.entry?.id ?? null).toBe(entryId);
  }
  if (finalText !== undefined) {
    expect(result.current.finalText).toBe(finalText);
  }
  if (streamText !== undefined) {
    expect(result.current.streamText).toBe(streamText);
  }
};

describe("useDictionaryExperience/view state", () => {
  beforeEach(() => {
    resetDictionaryExperienceTestState();
  });

  afterEach(() => {
    restoreDictionaryExperienceTimers();
  });

  /**
   * 测试目标：验证版本导航按钮仍可驱动版本切换并同步缓存。
   * 前置条件：mockStreamWord 返回含双版本记录，缓存命中 activeVersionId。
   * 步骤：
   *  1) 设置查询词并触发 handleSend；
   *  2) 调用 onNavigate("next") 切换到下一版本。
   * 断言：
   *  - setActiveVersion 收到缓存键与目标版本 ID；
   *  - dictionaryActionBarProps.activeVersionId 更新为目标 ID；
   *  - entry 与 finalText 对应目标版本，streamText 被清空。
   * 边界/异常：
   *  - 若不存在下一版本，应保持当前版本不变。
   */
  it("GivenMultipleVersions_WhenNavigatingForward_ThenUpdatesActiveEntry", async () => {
    const entryV1 = {
      id: "v1",
      term: "omega",
      markdown: "First meaning",
    };
    const entryV2 = {
      id: "v2",
      term: "omega",
      markdown: "Second meaning",
    };

    const { result, cacheKey } = await prepareVersionSelectionScenario({
      entryV1,
      entryV2,
    });

    expectDictionarySnapshot(result, {
      versionsLength: 2,
      activeVersionId: "v1",
    });

    await act(() => {
      result.current.dictionaryActionBarProps.onNavigate?.("next");
    });

    expect(mockSetActiveVersion).toHaveBeenCalledWith(cacheKey, "v2");
    expectDictionarySnapshot(result, {
      versionsLength: 2,
      activeVersionId: "v2",
      entryId: "v2",
      finalText: entryV2.markdown,
      streamText: "",
    });
  });

  /**
   * 测试目标：handleShowDictionary 需在存在释义内容时恢复空白首页。
   * 前置条件：mockStreamWord 返回有效 JSON，词条记录命中缓存版本。
   * 步骤：
   *  1) 通过 setText 与 handleSend 触发查询并生成版本数据；
   *  2) 调用 handleShowDictionary 重置视图。
   * 断言：
   *  - entry/finalText/streamText 归空；
   *  - dictionaryActionBarProps.versions 清空且 activeVersionId 置空；
   *  - activeSidebarView 恢复为 dictionary，loading 为 false。
   * 边界/异常：
   *  - 若取消查询逻辑未清理 loading，应导致断言失败提示状态未复位。
   */
  it("GivenDefinitionState_WhenHandleShowDictionary_ThenResetsToHome", async () => {
    const result = await prepareSingleEntryScenario({
      id: "v1",
      markdown: "## Meaning",
      term: "alpha",
    });

    expectDictionarySnapshot(result, {
      versionsLength: 1,
      activeVersionId: "v1",
      entryId: "v1",
      finalText: "## Meaning",
      streamText: "## Meaning",
    });

    act(() => {
      result.current.handleShowDictionary();
    });

    expectDictionarySnapshot(result, {
      versionsLength: 0,
      activeVersionId: null,
      entryId: null,
      finalText: "",
      streamText: "",
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.activeView).toBe("dictionary");
    expect(result.current.viewState.isDictionary).toBe(true);
  });
});
