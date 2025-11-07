import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import {
  useDictionaryExperience,
  mockStreamWord,
  utilsModule,
  createStreamFromChunks,
  resetDictionaryExperienceTestState,
  restoreDictionaryExperienceTimers,
} from "../testing/useDictionaryExperienceTestHarness.js";

/**
 * 意图：在测试期间替换全局 AbortController，并在完成后恢复原值。
 * 输入：MockCtor 表示用于替换的构造函数。
 * 输出：返回恢复函数，调用后还原全局状态。
 * 流程：缓存原始实现、覆写、返回恢复闭包。
 * 错误处理：调用方负责确保恢复函数最终执行。
 * 复杂度：O(1)。
 */
const installAbortControllerOverride = (MockCtor) => {
  const original = global.AbortController;
  global.AbortController = MockCtor;
  return () => {
    global.AbortController = original;
  };
};

/**
 * 意图：生成可观测的 AbortController 替身，便于统计 abort 调用次数。
 * 输入：abortSpy 捕获 abort 调用。
 * 输出：返回满足接口的构造函数。
 * 流程：持有监听集合，触发 abort 时逐个调用。
 * 错误处理：不处理外部异常，由调用方负责。
 * 复杂度：O(n)，n 为监听数量。
 */
const createAbortControllerDouble = (abortSpy) =>
  class MockAbortController {
    constructor() {
      this.listeners = new Set();
      this.signal = {
        aborted: false,
        addEventListener: (event, handler) => {
          if (event === "abort") {
            this.listeners.add(handler);
          }
        },
        removeEventListener: (event, handler) => {
          if (event === "abort") {
            this.listeners.delete(handler);
          }
        },
      };
    }

    abort() {
      if (this.signal.aborted) {
        return;
      }
      this.signal.aborted = true;
      abortSpy();
      for (const listener of this.listeners) {
        listener();
      }
    }
  };

/**
 * 意图：屏蔽 console.error 噪声，测试结束后恢复。
 * 输入：无。
 * 输出：返回恢复函数。
 * 流程：spyOn console.error 并返回 restore。
 * 错误处理：调用方负责最终恢复。
 * 复杂度：O(1)。
 */
const muteConsoleError = () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  return {
    restore: () => spy.mockRestore(),
    spy,
  };
};

/**
 * 意图：构造在 abort 前始终挂起的流式响应，用于测试中断逻辑。
 * 输入：signal 为 AbortSignal，abortError 为中断时抛出的错误。
 * 输出：返回始终等待的异步迭代器。
 * 流程：注册 abort 监听，触发后拒绝 Promise 并结束生成器。
 * 错误处理：依赖 signal 的 add/removeEventListener。
 * 复杂度：O(1)。
 */
const createAbortAwareStream = (signal, abortError) =>
  (async function* () {
    /* eslint-disable-next-line no-constant-condition */
    if (false) {
      yield undefined;
    }
    await new Promise((resolve) => {
      if (signal.aborted) {
        resolve();
        return;
      }
      const handleAbort = () => {
        signal.removeEventListener?.("abort", handleAbort);
        resolve();
      };
      signal.addEventListener?.("abort", handleAbort);
    });
    throw abortError;
  })();

/**
 * 意图：初始化查询文本并返回挂起的 handleSend Promise。
 * 输入：result 为 Hook 渲染结果。
 * 输出：返回 handleSend Promise 以便后续等待。
 * 流程：调用 setText 后立即执行 handleSend。
 * 错误处理：异常向上抛出。
 * 复杂度：O(1)。
 */
const beginLookup = (result) => {
  act(() => {
    result.current.setText("delayed term");
  });

  let pendingSend;
  act(() => {
    pendingSend = result.current.handleSend({
      preventDefault: jest.fn(),
    });
  });
  return pendingSend;
};

describe("useDictionaryExperience/lifecycle", () => {
  beforeEach(() => {
    resetDictionaryExperienceTestState();
  });

  afterEach(() => {
    restoreDictionaryExperienceTimers();
  });

  /**
   * 测试路径：查询过程中卸载组件，需调用 AbortController.abort 并避免卸载后 setState。
   * 步骤：启动查询但不等待结束，随后立即卸载 Hook。
   * 断言：AbortController.abort 被调用一次，且控制台无卸载后更新的警告。
   */
  it("aborts in-flight lookups on unmount to avoid stale state updates", async () => {
    const abortSpy = jest.fn();
    const abortError = Object.assign(new Error("Aborted"), {
      name: "AbortError",
    });
    const restoreAbortController = installAbortControllerOverride(
      createAbortControllerDouble(abortSpy),
    );

    mockStreamWord.mockImplementationOnce(({ signal }) =>
      createAbortAwareStream(signal, abortError),
    );

    const { restore: restoreConsole, spy: consoleErrorSpy } =
      muteConsoleError();
    const { result, unmount } = renderHook(() => useDictionaryExperience());

    try {
      const pendingSend = beginLookup(result);

      expect(mockStreamWord).toHaveBeenCalledTimes(1);
      expect(abortSpy).not.toHaveBeenCalled();

      act(() => {
        unmount();
      });

      expect(abortSpy).toHaveBeenCalledTimes(1);

      pendingSend.catch(() => {});

      const hasUnmountWarning = consoleErrorSpy.mock.calls.some(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes(
            "Can't perform a React state update on an unmounted component.",
          ),
      );
      expect(hasUnmountWarning).toBe(false);
    } finally {
      restoreConsole();
      restoreAbortController();
    }
  });

  /**
   * 测试目标：流式 Markdown 经归一化后需在 streamText 与 finalText 中保持一致。
   * 前置条件：polishDictionaryMarkdown mock 增加标记，流数据仅返回 Markdown 字符串。
   * 步骤：触发 handleSend 并消费异步生成器。
   * 断言：
   *  - streamText 等于归一化结果；
   *  - finalText 同样输出归一化字符串。
   * 边界/异常：覆盖非 JSON 流场景。
   */
  it("GivenStreamingMarkdown_WhenNormalized_ShouldExposePolishedPreviewAndFinal", async () => {
    utilsModule.polishDictionaryMarkdown.mockImplementation(
      (value) => `normalized:${value}`,
    );
    mockStreamWord.mockImplementation(() =>
      createStreamFromChunks({ chunk: "**raw**", language: "ENGLISH" }),
    );

    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      result.current.setText("term");
    });

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    expect(result.current.streamText).toBe("normalized:**raw**");
    expect(result.current.finalText).toBe("normalized:**raw**");
  });
});
