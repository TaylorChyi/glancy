import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import {
  useDictionaryExperience,
  utilsModule,
  mockFetchWordWithHandling,
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

const isUnmountWarningCall = (call) =>
  typeof call[0] === "string" &&
  call[0].includes(
    "Can't perform a React state update on an unmounted component.",
  );

const runAbortLookupScenario = async (assertion) => {
  const abortSpy = jest.fn();
  const restoreAbortController = installAbortControllerOverride(
    createAbortControllerDouble(abortSpy),
  );

  let resolveFetch;
  const pendingFetch = new Promise((resolve) => {
    resolveFetch = resolve;
  });
  mockFetchWordWithHandling.mockReturnValueOnce(pendingFetch);

  const { restore: restoreConsole, spy: consoleErrorSpy } = muteConsoleError();
  const { result, unmount } = renderHook(() => useDictionaryExperience());

  try {
    const pendingSend = beginLookup(result);

    expect(abortSpy).not.toHaveBeenCalled();

    act(() => {
      unmount();
    });

    resolveFetch({
      data: null,
      error: null,
      language: "ENGLISH",
      flavor: "default",
    });

    await pendingSend.catch(() => {});

    await assertion({ abortSpy, consoleErrorSpy });
  } finally {
    restoreConsole();
    restoreAbortController();
  }
};

describe("useDictionaryExperience/lifecycle", () => {
  beforeEach(() => {
    resetDictionaryExperienceTestState();
  });

  afterEach(() => {
    restoreDictionaryExperienceTimers();
  });

  it("aborts in-flight lookups on unmount to avoid stale state updates", async () => {
    await runAbortLookupScenario(async ({ abortSpy }) => {
      expect(abortSpy).toHaveBeenCalledTimes(1);
    });
  });

  it("suppresses state update warnings after aborting on unmount", async () => {
    await runAbortLookupScenario(async ({ consoleErrorSpy }) => {
      const hasUnmountWarning = consoleErrorSpy.mock.calls.some(
        isUnmountWarningCall,
      );
      expect(hasUnmountWarning).toBe(false);
    });
  });

  it("GivenSynchronousFetch_WhenMarkdownPolished_ShouldExposeNormalizedFinal", async () => {
    utilsModule.polishDictionaryMarkdown.mockImplementation(
      (value) => `normalized:${value}`,
    );
    mockFetchWordWithHandling.mockResolvedValueOnce({
      data: {
        term: "term",
        markdown: "**raw**",
        language: "ENGLISH",
      },
      error: null,
      language: "ENGLISH",
      flavor: "default",
    });

    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      result.current.setText("term");
    });

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    expect(result.current.finalText).toBe("normalized:**raw**");
    expect(result.current.entry?.markdown).toBe("normalized:**raw**");
  });
});
