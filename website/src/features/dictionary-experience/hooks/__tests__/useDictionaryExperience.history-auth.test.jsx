/**
 * 背景：
 *  - 历史记录写入与鉴权流程属于治理关键路径，需要与业务逻辑同步演进。
 * 目的：
 *  - 拆分认证与历史采集用例，避免与其他领域耦合导致测试臃肿。
 * 关键决策与取舍：
 *  - 通过公共 harness 重用上下文，确保环境初始化一致；
 *  - 将不同治理策略（纠错写入、开关控制）集中在同一文件便于对照分析。
 * 影响范围：
 *  - 覆盖登录态检查、词条纠正写入与数据治理开关的核心逻辑。
 * 演进与TODO：
 *  - 未来可补充多语言历史写入与匿名模式的策略差异。
 */
import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import {
  useDictionaryExperience,
  mockUserState,
  mockNavigate,
  mockStreamWord,
  mockHistoryApi,
  mockGetRecord,
  mockGetEntry,
  createStreamFromChunks,
  useDataGovernanceStore,
  resetDictionaryExperienceTestState,
  restoreDictionaryExperienceTimers,
} from "../testing/useDictionaryExperienceTestHarness.js";

describe("useDictionaryExperience/history & auth", () => {
  beforeEach(() => {
    resetDictionaryExperienceTestState();
  });

  afterEach(() => {
    restoreDictionaryExperienceTimers();
  });

  /**
   * 测试路径：无用户登录时提交查询，需立即引导至登录页。
   * 步骤：构造空用户上下文，调用 handleSend。
   * 断言：应触发导航到 /login，且不会调用历史写入。
   */
  it("redirects to login when submitting without an authenticated user", async () => {
    mockUserState.user = null;
    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login");
    expect(mockHistoryApi.addHistory).not.toHaveBeenCalled();
  });

  /**
   * 测试目标：当模型返回纠正后的词条时，历史写入应以纠正词条为准。
   * 前置条件：mockStreamWord 产出 term 为 "student" 的词条数据，用户输入 "studdent"。
   * 步骤：
   *  1) 设置输入框文本为 "studdent"；
   *  2) 调用 handleSend 触发查询流程；
   * 断言：
   *  - addHistory 首个参数为 "student"；
   *  - addHistory 仅被调用一次。
   * 边界/异常：
   *  - 若模型未返回 term，应退回原始输入（此用例不覆盖）。
   */
  it("writes corrected term into history when lookup normalizes input", async () => {
    const correctedEntry = { term: "student", markdown: "definition" };
    mockStreamWord.mockImplementation(() =>
      createStreamFromChunks({
        chunk: JSON.stringify(correctedEntry),
        language: "ENGLISH",
      }),
    );
    mockGetRecord.mockReturnValue({
      versions: [correctedEntry],
      activeVersionId: "student",
    });
    mockGetEntry.mockImplementation(() => correctedEntry);

    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      result.current.setText("studdent");
    });

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    expect(mockHistoryApi.addHistory).toHaveBeenCalledTimes(1);
    expect(mockHistoryApi.addHistory.mock.calls[0][0]).toBe("student");
  });

  /**
   * 测试目标：关闭历史采集后不应写入历史。
   * 前置条件：historyCaptureEnabled 为 false。
   * 步骤：
   *  1) 关闭采集；
   *  2) 触发查询流程。
   * 断言：
   *  - addHistory 未被调用。
   * 边界/异常：
   *  - 若调用说明前端未尊重治理策略。
   */
  it("skips history addition when capture disabled", async () => {
    useDataGovernanceStore.setState({ historyCaptureEnabled: false });
    mockStreamWord.mockImplementation(() =>
      createStreamFromChunks({
        chunk: JSON.stringify({ term: "mute", markdown: "md" }),
        language: "ENGLISH",
      }),
    );

    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      result.current.setText("mute");
    });

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    expect(mockHistoryApi.addHistory).not.toHaveBeenCalled();
  });
});
