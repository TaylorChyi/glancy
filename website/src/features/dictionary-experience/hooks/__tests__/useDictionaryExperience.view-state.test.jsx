import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import {
  useDictionaryExperience,
  mockStreamWord,
  mockWordStoreState,
  mockGetRecord,
  mockGetEntry,
  createStreamFromChunks,
  resetDictionaryExperienceTestState,
  restoreDictionaryExperienceTimers,
} from "../testing/useDictionaryExperienceTestHarness.js";

const runLookup = async (result, term) => {
  await act(async () => {
    result.current.setText(term);
  });

  await act(async () => {
    await result.current.handleSend({ preventDefault: jest.fn() });
  });
};

describe("useDictionaryExperience/view state", () => {
  beforeEach(() => {
    resetDictionaryExperienceTestState();
  });

  afterEach(() => {
    restoreDictionaryExperienceTimers();
  });

  /**
   * 测试目标：查询成功后应填充 entry/finalText，且工具栏不再暴露版本列表。
   */
  it("hydrates entry without exposing version controls", async () => {
    const entry = { id: "v1", term: "omega", markdown: "definition" };
    mockGetRecord.mockReturnValue({ entry });
    mockGetEntry.mockReturnValue(entry);
    mockStreamWord.mockImplementation(() =>
      createStreamFromChunks({ chunk: JSON.stringify(entry), language: "EN" }),
    );

    const { result } = renderHook(() => useDictionaryExperience());
    await runLookup(result, entry.term);

    expect(result.current.entry?.id).toBe("v1");
    expect(result.current.finalText).toBe("definition");
    expect(
      result.current.dictionaryActionBarProps.onSelectVersion,
    ).toBeUndefined();
    expect(result.current.dictionaryActionBarProps.versions).toEqual([]);
  });

  /**
   * 测试目标：切换到致用单词视图后再返回，应恢复默认视图并清理词条状态。
   */
  it("resets dictionary state when returning from library", async () => {
    const entry = { id: "only", term: "lyra", markdown: "definition" };
    mockGetRecord.mockReturnValue({ entry });
    mockGetEntry.mockReturnValue(entry);
    mockStreamWord.mockImplementation(() =>
      createStreamFromChunks({ chunk: JSON.stringify(entry), language: "EN" }),
    );

    const { result } = renderHook(() => useDictionaryExperience());
    await runLookup(result, entry.term);

    act(() => {
      result.current.handleShowLibrary();
    });
    expect(result.current.activeView).toBe("library");

    act(() => {
      result.current.handleShowDictionary();
    });

    expect(result.current.activeView).toBe("dictionary");
    expect(result.current.entry).toBeNull();
    expect(result.current.finalText).toBe("");
    expect(result.current.streamText).toBe("");
  });

  /**
   * 测试目标：handleSelectHistory 应重用缓存并维持单一版本输出。
   */
  it("selects history without restoring version state", async () => {
    const entry = { id: "cached", term: "nova", markdown: "cached" };
    mockWordStoreState.entries = {
      "nova-ENGLISH": { entry },
    };
    mockGetRecord.mockImplementation((key) => mockWordStoreState.entries[key]);
    mockGetEntry.mockImplementation(() => entry);
    mockStreamWord.mockImplementation(() =>
      createStreamFromChunks({ chunk: JSON.stringify(entry), language: "EN" }),
    );

    const { result } = renderHook(() => useDictionaryExperience());
    await runLookup(result, "nova");

    act(() => {
      result.current.handleSelectHistory("nova");
    });

    expect(result.current.entry?.id).toBe("cached");
    expect(result.current.dictionaryActionBarProps.versions).toEqual([]);
  });
});
