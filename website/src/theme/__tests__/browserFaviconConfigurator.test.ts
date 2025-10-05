import { createBrowserFaviconConfigurator } from "@/theme/browserFaviconConfigurator";
import { createFaviconRegistry } from "@/theme/faviconRegistry";

type MutableMediaQueryList = MediaQueryList & {
  dispatch: (matches: boolean) => void;
  listeners: Array<(event: MediaQueryListEvent) => void>;
};

const createMediaQuery = (initialMatches: boolean): MutableMediaQueryList => {
  let matches = initialMatches;
  const media: Partial<MutableMediaQueryList> = {
    media: "(prefers-color-scheme: dark)",
    matches,
    listeners: [],
    addEventListener(type: string, listener: (event: MediaQueryListEvent) => void) {
      if (type === "change") {
        media.listeners?.push(listener);
      }
    },
    removeEventListener(type: string, listener: (event: MediaQueryListEvent) => void) {
      if (type === "change" && media.listeners) {
        media.listeners = media.listeners.filter((item) => item !== listener);
      }
    },
    dispatch(nextMatch: boolean) {
      matches = nextMatch;
      media.matches = nextMatch;
      for (const listener of media.listeners ?? []) {
        listener({
          matches: nextMatch,
          media: media.media ?? "",
        } as MediaQueryListEvent);
      }
    },
  };

  return media as MutableMediaQueryList;
};

describe("BrowserFaviconConfigurator", () => {
  const registry = createFaviconRegistry({
    default: "https://assets.local/light.svg",
    light: "https://assets.local/light.svg",
    dark: "https://assets.local/dark.svg",
  });

  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  /**
   * 测试目标：在浏览器暗色主题下应立即切换到白色 favicon。
   * 前置条件：存在 id 为 favicon 的 link 节点，媒体查询初始匹配暗色。
   * 步骤：
   *  1) 启动配置器；
   *  2) 观察 link 属性。
   * 断言：
   *  - href 指向暗色资源；
   *  - dataset.browserColorScheme === "dark"。
   * 边界/异常：
   *  - 验证不会抛出异常。
   */
  test("Given_dark_preference_When_starting_Then_apply_dark_icon", () => {
    document.head.innerHTML =
      '<link id="favicon" rel="icon" href="https://assets.local/light.svg" />';
    const media = createMediaQuery(true);
    const configurator = createBrowserFaviconConfigurator({
      registry,
      matchMedia: () => media,
      document,
    });

    expect(() => configurator.start()).not.toThrow();

    const link = document.getElementById("favicon");
    expect(link).toBeInstanceOf(HTMLLinkElement);
    expect((link as HTMLLinkElement).href).toBe("https://assets.local/dark.svg");
    expect((link as HTMLLinkElement).dataset.browserColorScheme).toBe("dark");
  });

  /**
   * 测试目标：媒体查询变化时应同步切换到对应 favicon。
   * 前置条件：已启动配置器，初始为暗色匹配。
   * 步骤：
   *  1) 触发媒体查询变更为亮色；
   *  2) 检查 link 属性；
   *  3) 调用 stop 并确认监听被移除。
   * 断言：
   *  - href 更新为亮色资源；
   *  - dataset.browserColorScheme === "light"；
   *  - 停止后监听列表为空。
   * 边界/异常：
   *  - 覆盖 stop 释放监听的路径。
   */
  test("Given_media_change_When_dispatching_Then_update_icon_and_detach_on_stop", () => {
    document.head.innerHTML =
      '<link id="favicon" rel="icon" href="https://assets.local/light.svg" />';
    const media = createMediaQuery(true);
    const configurator = createBrowserFaviconConfigurator({
      registry,
      matchMedia: () => media,
      document,
    });

    configurator.start();
    media.dispatch(false);

    const link = document.getElementById("favicon");
    expect((link as HTMLLinkElement).href).toBe("https://assets.local/light.svg");
    expect((link as HTMLLinkElement).dataset.browserColorScheme).toBe("light");

    configurator.stop();
    expect(media.listeners).toHaveLength(0);
  });

  /**
   * 测试目标：缺失 favicon link 时不应抛错或注册监听。
   * 前置条件：文档中不存在 id=missing 元素。
   * 步骤：
   *  1) 启动配置器；
   *  2) 检查媒体查询监听状态。
   * 断言：
   *  - media.listeners 长度保持 0；
   *  - start 返回后未抛异常。
   * 边界/异常：
   *  - 验证容错路径。
   */
  test("Given_missing_link_When_starting_Then_fail_silently", () => {
    const media = createMediaQuery(true);
    const configurator = createBrowserFaviconConfigurator({
      registry,
      matchMedia: () => media,
      document,
      linkId: "missing",
    });

    expect(() => configurator.start()).not.toThrow();
    expect(media.listeners).toHaveLength(0);
  });
});
