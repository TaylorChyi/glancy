import { jest } from "@jest/globals";
import { createHelpSubmenuItems, type UserMenuLabels } from "../support";

describe("createHelpSubmenuItems", () => {
  let dispatchSpy: jest.SpyInstance | undefined;

  beforeEach(() => {
    dispatchSpy = jest.spyOn(window, "dispatchEvent");
  });

  afterEach(() => {
    dispatchSpy?.mockRestore();
    dispatchSpy = undefined;
  });

  /**
   * 测试目标：验证完整翻译下帮助子菜单会生成对应的事件处理器。
   * 前置条件：提供覆盖全部帮助项的 labels，并注入快捷键回调。
   * 步骤：
   *  1) 基于 labels 构建帮助子项。
   *  2) 依次触发快捷键与帮助中心条目。
   * 断言：
   *  - 快捷键条目调用 onOpenShortcuts（失败信息：快捷键回调未被执行）。
   *  - 帮助中心条目派发 glancy-help 事件且 action 为 center（失败信息：帮助事件协议不一致）。
   * 边界/异常：
   *  - 未覆盖窗口对象缺失场景，该分支由运行环境保证。
   */
  test("Given_translated_labels_When_building_items_Then_emit_expected_actions", () => {
    const labels: UserMenuLabels = {
      help: "帮助",
      settings: "设置",
      shortcuts: "快捷键",
      logout: "退出",
      helpCenter: "帮助中心",
      releaseNotes: "版本说明",
      termsPolicies: "条款与政策",
      reportBug: "问题反馈",
      downloadApps: "下载应用",
    };
    const onOpenShortcuts = jest.fn();

    const items = createHelpSubmenuItems(labels, onOpenShortcuts);

    expect(items).toHaveLength(6);

    const shortcuts = items.find((item) => item.id === "help-shortcuts");
    shortcuts?.onSelect?.();
    expect(onOpenShortcuts).toHaveBeenCalledTimes(1);

    const center = items.find((item) => item.id === "help-center");
    const spy = dispatchSpy;
    expect(spy).toBeDefined();
    if (!spy) {
      throw new Error("dispatchSpy is not initialized");
    }
    spy.mockClear();
    center?.onSelect?.();

    expect(spy).toHaveBeenCalledTimes(1);
    const [event] = spy.mock.calls[0];
    expect(event).toBeInstanceOf(CustomEvent);
    expect(event.type).toBe("glancy-help");
    expect(event.detail).toEqual({ action: "center" });
  });

  /**
   * 测试目标：验证缺失翻译时帮助子菜单会退化为使用总帮助文案。
   * 前置条件：labels 仅提供 help 与 shortcuts 基础文案。
   * 步骤：
   *  1) 构建帮助子项。
   *  2) 触发版本说明条目。
   * 断言：
   *  - 版本说明条目使用 help 作为回退文案（失败信息：帮助子项未按约定回退）。
   *  - 事件 action 为 notes（失败信息：帮助事件 action 不正确）。
   * 边界/异常：
   *  - 仅覆盖单个缺省场景，其余 fallback 行为由同构逻辑保证。
   */
  test("Given_missing_translations_When_building_items_Then_fallback_to_help_label", () => {
    const labels: UserMenuLabels = {
      help: "帮助",
      settings: "设置",
      shortcuts: "快捷键",
      logout: "退出",
    };
    const onOpenShortcuts = jest.fn();

    const items = createHelpSubmenuItems(labels, onOpenShortcuts);

    const notes = items.find((item) => item.id === "help-notes");
    expect(notes?.label).toBe("帮助");

    const spy = dispatchSpy;
    expect(spy).toBeDefined();
    if (!spy) {
      throw new Error("dispatchSpy is not initialized");
    }
    spy.mockClear();
    notes?.onSelect?.();

    expect(spy).toHaveBeenCalledTimes(1);
    const [event] = spy.mock.calls[0];
    expect(event.detail).toEqual({ action: "notes" });
  });
});
