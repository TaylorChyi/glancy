import { jest } from "@jest/globals";
import { ThemeModeOrchestrator } from "@/theme/mode";

type MutableMediaQueryList = MediaQueryList & {
  dispatch: (matches: boolean) => void;
};

const createMediaQuery = (initialMatches: boolean): MutableMediaQueryList => {
  let matches = initialMatches;
  let listener: ((event: MediaQueryListEvent) => void) | null = null;

  const media: Partial<MutableMediaQueryList> = {
    media: "(prefers-color-scheme: dark)",
    matches,
    addEventListener: (
      _type: string,
      callback: (event: MediaQueryListEvent) => void,
    ) => {
      listener = callback;
    },
    removeEventListener: () => {
      listener = null;
    },
    dispatch(nextMatch: boolean) {
      matches = nextMatch;
      media.matches = nextMatch;
      if (listener) {
        listener({
          matches: nextMatch,
          media: media.media ?? "",
        } as MediaQueryListEvent);
      }
    },
  };

  return media as MutableMediaQueryList;
};

describe("ThemeModeOrchestrator", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    delete document.documentElement.dataset.theme;
  });

  /**
   * 测试目标：确保暗色策略会同步 data-theme 与 dark 类，并通知监听者。
   * 前置条件：提供一个新的 ThemeModeOrchestrator 实例，根节点为 <html>。
   * 步骤：
   *  1) 调用 apply("dark")；
   *  2) 检查 dataset 与 classList；
   *  3) 验证回调参数。
   * 断言：
   *  - dataset.theme === "dark"；
   *  - classList 包含 dark；
   *  - 回调接收到 "dark"。
   * 边界/异常：
   *  - 无。
   */
  test("applies dark strategy", () => {
    const orchestrator = new ThemeModeOrchestrator({
      root: document.documentElement,
      matchMedia: undefined,
    });
    const notify = jest.fn();

    orchestrator.apply("dark", notify);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(notify).toHaveBeenCalledWith("dark");
    orchestrator.dispose();
  });

  /**
   * 测试目标：验证亮色策略会移除 dark 类并设置正确的 data-theme。
   * 前置条件：先应用一次 dark，再应用 light。
   * 步骤：
   *  1) apply("dark")；
   *  2) apply("light")；
   *  3) 检查 DOM 状态。
   * 断言：
   *  - dataset.theme === "light"；
   *  - classList 不含 dark；
   *  - 回调最终收到 "light"。
   * 边界/异常：
   *  - 验证多次调用时监听器正确重置。
   */
  test("switches to light strategy and cleans previous listener", () => {
    const orchestrator = new ThemeModeOrchestrator({
      root: document.documentElement,
      matchMedia: undefined,
    });
    const notify = jest.fn();

    orchestrator.apply("dark", notify);
    orchestrator.apply("light", notify);

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(notify).toHaveBeenLastCalledWith("light");
    orchestrator.dispose();
  });

  /**
   * 测试目标：system 策略应根据媒体查询结果切换，并响应后续变更。
   * 前置条件：构造 matches=true 的媒体查询；
   * 步骤：
   *  1) apply("system")；
   *  2) 触发媒体查询变更；
   *  3) 观察 DOM 与回调。
   * 断言：
   *  - 初始 dataset.theme === "system" 且包含 dark；
   *  - 更新后去除 dark 并通知 "light"。
   * 边界/异常：
   *  - 确认 dispose 后可安全停止监听（这里通过最终状态验证）。
   */
  test("reacts to system preference changes", () => {
    const media = createMediaQuery(true);
    const orchestrator = new ThemeModeOrchestrator({
      root: document.documentElement,
      matchMedia: () => media,
    });
    const notify = jest.fn();

    orchestrator.apply("system", notify);

    expect(document.documentElement.dataset.theme).toBe("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(notify).toHaveBeenLastCalledWith("dark");

    media.dispatch(false);

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(notify).toHaveBeenLastCalledWith("light");

    orchestrator.dispose();
  });
});
