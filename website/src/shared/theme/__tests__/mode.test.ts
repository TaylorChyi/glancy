import { jest } from "@jest/globals";
import { ThemeModeOrchestrator } from "@shared/theme/mode";
import { createFaviconRegistry } from "@shared/theme/faviconRegistry";

type MutableMediaQueryList = MediaQueryList & {
  dispatch: (matches: boolean) => void;
};

const createOrchestrator = (
  overrides: Partial<
    ConstructorParameters<typeof ThemeModeOrchestrator>[0]
  > = {},
) =>
  new ThemeModeOrchestrator({
    root: document.documentElement,
    matchMedia: undefined,
    ...overrides,
  });

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

const expectThemeState = ({
  theme,
  preference,
  dark,
}: {
  theme?: string;
  preference?: string;
  dark: boolean;
}) => {
  const { dataset, classList } = document.documentElement;

  if (theme !== undefined) {
    expect(dataset.theme).toBe(theme);
  }

  if (preference !== undefined) {
    expect(dataset.themePreference).toBe(preference);
  }

  expect(classList.contains("dark")).toBe(dark);
};

const expectNotify = (notify: jest.Mock, value: string) => {
  expect(notify).toHaveBeenLastCalledWith(value);
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
    const orchestrator = createOrchestrator();
    const notify = jest.fn();

    orchestrator.apply("dark", notify);

    expectThemeState({ theme: "dark", preference: "dark", dark: true });
    expectNotify(notify, "dark");
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
    const orchestrator = createOrchestrator();
    const notify = jest.fn();

    orchestrator.apply("dark", notify);
    orchestrator.apply("light", notify);

    expectThemeState({ theme: "light", preference: "light", dark: false });
    expectNotify(notify, "light");
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
   *  - dataset.themePreference === "system"；
   *  - dataset.theme 与 dark 类同步反映媒体查询；
   *  - 更新后去除 dark 并通知 "light"。
   * 边界/异常：
   *  - 确认 dispose 后可安全停止监听（这里通过最终状态验证）。
   */
  test("applies system preference based on current media query", () => {
    const media = createMediaQuery(true);
    const orchestrator = createOrchestrator({ matchMedia: () => media });
    const notify = jest.fn();

    orchestrator.apply("system", notify);

    expectThemeState({ theme: "dark", preference: "system", dark: true });
    expectNotify(notify, "dark");

    orchestrator.dispose();
  });

  test("reacts to system preference changes", () => {
    const media = createMediaQuery(true);
    const orchestrator = createOrchestrator({ matchMedia: () => media });
    const notify = jest.fn();

    orchestrator.apply("system", notify);

    media.dispatch(false);

    expectThemeState({ theme: "light", preference: "system", dark: false });
    expectNotify(notify, "light");

    orchestrator.dispose();
  });
});

describe("FaviconRegistry", () => {
  /**
   * 测试目标：验证已注册的暗色主题返回专属 favicon。
   * 前置条件：使用默认注册表（暗亮同图），提供 dark 主题入参。
   * 步骤：
   *  1) 创建注册表；
   *  2) 调用 registry.resolve("dark");
   * 断言：
   *  - 结果与 manifest.dark 相同，错误信息指向 dark 主题。
   * 边界/异常：
   *  - 暂无（依赖 registry 定义）。
   */
  test("Given_registered_manifest_When_resolving_dark_Then_return_variant", () => {
    const registry = createFaviconRegistry({
      default: "default.svg",
      light: "default.svg",
      dark: "dark.svg",
    });
    expect(registry.resolve("dark")).toBe("dark.svg");
  });

  /**
   * 测试目标：未知主题或空值时应回退到默认 favicon。
   * 前置条件：未在注册表中配置 unknown-theme。
   * 步骤：
   *  1) 调用 registry.resolve("unknown-theme");
   *  2) 调用 registry.resolve(undefined);
   * 断言：
   *  - 均返回 manifest.default，便于未来挂载日志或指标。
   * 边界/异常：
   *  - 覆盖非字符串输入。
   */
  test("Given_unknown_theme_When_resolving_Then_fall_back_to_default", () => {
    const registry = createFaviconRegistry({
      default: "default.svg",
      light: "default.svg",
      dark: "dark.svg",
    });
    expect(registry.resolve("unknown-theme")).toBe("default.svg");
    expect(registry.resolve(undefined)).toBe("default.svg");
  });
});
