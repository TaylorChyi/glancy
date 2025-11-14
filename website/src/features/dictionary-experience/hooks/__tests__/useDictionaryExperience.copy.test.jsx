import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import {
  useDictionaryExperience,
  COPY_FEEDBACK_STATES,
  mockFetchWordWithHandling,
  mockGetRecord,
  mockGetEntry,
  utilsModule,
  resetDictionaryExperienceTestState,
  restoreDictionaryExperienceTimers,
} from "../testing/useDictionaryExperienceTestHarness.js";

/**
 * 意图：构造可复制词条，确保复制交互具备必要上下文。
 * 输入：result 为 hook 渲染结果，entry 为目标词条对象。
 * 输出：完成一次查询并使工具栏进入可复制态。
 * 流程：
 *  1) 建立词条缓存替身；
 *  2) 通过 setText 与 handleSend 完成查询；
 *  3) 等待异步流程结束。
 * 错误处理：直接抛出异常以让测试失败。
 * 复杂度：O(n)（n 为生成器推送次数，本场景恒为 1）。
 */
const bootstrapCopyableEntry = async (result, entry) => {
  mockGetRecord.mockReturnValue({ entry });
  mockGetEntry.mockImplementation(() => entry);
  mockFetchWordWithHandling.mockResolvedValueOnce({
    data: entry,
    error: null,
    language: "ENGLISH",
    flavor: "default",
  });

  await act(async () => {
    result.current.setText(entry.term);
  });

  await act(async () => {
    await result.current.handleSend({ preventDefault: jest.fn() });
  });
};

/**
 * 意图：触发复制动作并等待内部异步回调。
 * 输入：result 为 hook 渲染结果。
 * 输出：返回复制 Promise 以便上层测试串联。
 * 流程：直接调用工具栏 onCopy 并等待完成。
 * 错误处理：异常向上抛出，由测试用例断言。
 * 复杂度：O(1)。
 */
const executeCopyAction = async (result) => {
  await act(async () => {
    await result.current.dictionaryActionBarProps.onCopy();
  });
};

/**
 * 意图：根据传入配置渲染 Hook 并可选地准备复制词条。
 * 输入：entry 指定需预加载的词条，clipboard 控制剪贴板模拟行为。
 * 输出：返回渲染结果实例供后续断言使用。
 * 流程：
 *  1) 预配置剪贴板 mock；
 *  2) 渲染 Hook；
 *  3) 如传入 entry，则调用 bootstrapCopyableEntry。
 * 错误处理：异常向上抛出，由测试驱动。
 * 复杂度：O(1)。
 */
const prepareCopyScenario = async ({ entry, clipboard } = {}) => {
  if (clipboard?.resolve) {
    utilsModule.copyTextToClipboard.mockResolvedValueOnce(clipboard.resolve);
  }
  if (clipboard?.reject) {
    utilsModule.copyTextToClipboard.mockRejectedValueOnce(clipboard.reject);
  }

  const { result } = renderHook(() => useDictionaryExperience());

  if (entry) {
    await bootstrapCopyableEntry(result, entry);
  }

  return result;
};

/**
 * 意图：抽象常用断言，提升复制状态检查的可读性。
 * 输入：result 为 Hook 渲染结果，expectation 描述预期状态。
 * 输出：无返回值，若断言失败将抛出异常。
 * 流程：校验反馈状态、成功标志与可选的弹窗状态。
 * 错误处理：依赖 Jest 断言报告。
 * 复杂度：O(1)。
 */
const expectCopySnapshot = (
  result,
  { state, success, popupMsg = undefined, popupOpen = undefined },
) => {
  expect(result.current.dictionaryActionBarProps.copyFeedbackState).toBe(state);
  expect(result.current.dictionaryActionBarProps.isCopySuccess).toBe(success);
  if (popupMsg !== undefined) {
    expect(result.current.popupMsg).toBe(popupMsg);
  }
  if (popupOpen !== undefined) {
    expect(result.current.popupOpen).toBe(popupOpen);
  }
};

/**
 * 意图：推进复制成功后的冷却窗口，帮助验证状态回落。
 * 输入：无。
 * 输出：无，内部推进 Jest 计时器并刷新微任务队列。
 * 流程：推进 2000ms 后 await 一个 Promise 以模拟事件循环。
 * 错误处理：若未启用 fake timers 将抛出异常提醒测试修正。
 * 复杂度：O(1)。
 */
const advanceCopyResetWindow = async () => {
  await act(async () => {
    jest.advanceTimersByTime(2000);
  });
  await act(async () => {
    await Promise.resolve();
  });
};

/**
 * 意图：按照步骤执行复制动作并校验剪贴板调用与状态快照。
 * 输入：result 为 Hook 渲染结果，steps 为断言序列。
 * 输出：无，若断言失败直接抛错。
 * 流程：逐个执行 before 钩子，随后校验剪贴板调用次数与状态。
 * 错误处理：依赖 Jest 断言。
 * 复杂度：O(n)，n 为步骤数量。
 */
const verifyCopyLifecycle = async (result, steps) => {
  for (const step of steps) {
    if (step.before) {
      await step.before();
    }
    if (typeof step.clipboardCalls === "number") {
      expect(utilsModule.copyTextToClipboard).toHaveBeenCalledTimes(
        step.clipboardCalls,
      );
    }
    if (step.snapshot) {
      expectCopySnapshot(result, step.snapshot);
    }
  }
};

const buildSuccessfulCopySteps = (result) => [
  {
    before: () => executeCopyAction(result),
    clipboardCalls: 1,
    snapshot: {
      state: COPY_FEEDBACK_STATES.SUCCESS,
      success: true,
      popupMsg: "",
      popupOpen: false,
    },
  },
  {
    before: advanceCopyResetWindow,
    snapshot: {
      state: COPY_FEEDBACK_STATES.IDLE,
      success: false,
      popupMsg: "",
    },
  },
];

describe("useDictionaryExperience/copy feedback", () => {
  beforeEach(() => {
    resetDictionaryExperienceTestState();
  });

  afterEach(() => {
    restoreDictionaryExperienceTimers();
  });

  /**
   * 测试目标：复制成功后状态机应进入 success，并在延迟后恢复 idle；
   * 同时不再弹出成功提示，避免重复反馈。
   * 前置条件：mockFetchWordWithHandling 返回含 markdown 的词条，clipboard 写入成功。
   * 步骤：
   *  1) 通过辅助函数准备词条；
   *  2) 调用工具栏 onCopy；
   *  3) 推进计时器 2 秒等待复位。
   * 断言：
   *  - copyTextToClipboard 被调用一次；
   *  - popupOpen 保持 false，popupMsg 为空字符串；
   *  - copyFeedbackState 由 success 退回 idle，isCopySuccess 相应更新。
   * 边界/异常：
   *  - 若定时器未清理，状态将停留在 success 触发断言失败。
   */
  it("GivenSuccessfulCopy_WhenCopyInvoked_ThenShowsSuccessAndResets", async () => {
    jest.useFakeTimers();

    const entry = { id: "v-copy", term: "delta", markdown: "## Meaning" };
    const result = await prepareCopyScenario({
      entry,
      clipboard: { resolve: { status: "copied" } },
    });

    expect(result.current.dictionaryActionBarProps.canCopy).toBe(true);

    await verifyCopyLifecycle(result, buildSuccessfulCopySteps(result));
  });

  /**
   * 测试目标：当复制内容为空时，状态机保持 idle 并避免触发 clipboard 写入。
   * 前置条件：未加载任何词条内容，copyPayload 为空字符串。
   * 步骤：
   *  1) 直接调用工具栏 onCopy；
   * 断言：
   *  - copyTextToClipboard 不会被调用；
   *  - copyFeedbackState 与 isCopySuccess 维持初始值。
   * 边界/异常：
   *  - 若误判可复制导致调用 clipboard，将触发断言失败。
   */
  it("GivenEmptyClipboardPayload_WhenCopyInvoked_ThenStaysIdle", async () => {
    const result = await prepareCopyScenario();

    await verifyCopyLifecycle(result, [
      {
        before: () => executeCopyAction(result),
        clipboardCalls: 0,
        snapshot: {
          state: COPY_FEEDBACK_STATES.IDLE,
          success: false,
        },
      },
    ]);
  });

  /**
   * 测试目标：复制出现异常时需立即回退至 idle，避免卡在成功态。
   * 前置条件：clipboard 写入抛出异常，已有词条可复制。
   * 步骤：
   *  1) 构造词条并触发 onCopy；
   * 断言：
   *  - copyFeedbackState 仍为 idle；
   *  - isCopySuccess 为 false。
   * 边界/异常：
   *  - 若异常分支未处理，状态将残留导致断言失败。
   */
  it("GivenClipboardFailure_WhenCopyInvoked_ThenResetsToIdle", async () => {
    jest.useFakeTimers();

    const entry = { id: "v-error", term: "epsilon", markdown: "## Alt" };
    const result = await prepareCopyScenario({
      entry,
      clipboard: { reject: new Error("clipboard failed") },
    });

    await verifyCopyLifecycle(result, [
      {
        before: () => executeCopyAction(result),
        clipboardCalls: 1,
        snapshot: {
          state: COPY_FEEDBACK_STATES.IDLE,
          success: false,
        },
      },
    ]);
  });
});
