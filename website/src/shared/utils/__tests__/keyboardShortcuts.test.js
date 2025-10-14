import {
  captureKeysFromEvent,
  doesEventMatchShortcut,
  mergeShortcutLists,
  translateShortcutAction,
  DEFAULT_SHORTCUTS,
} from "../keyboardShortcuts.js";

/**
 * 测试目标：captureKeysFromEvent 应将键盘事件归一化为修饰键 + 主键数组。
 * 前置条件：事件对象包含 ctrl 与 shift 修饰符以及字母键。
 * 步骤：
 *  1) 构造伪事件并调用 captureKeysFromEvent；
 * 断言：
 *  - 返回数组与预期顺序一致；
 * 边界/异常：
 *  - 若仅有修饰键则应返回 null（由其他用例覆盖）。
 */
test("Given ctrl+shift+letter When capturing event Then return normalized keys", () => {
  const event = {
    key: "p",
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: true,
  };
  expect(captureKeysFromEvent(event)).toEqual(["CONTROL", "SHIFT", "P"]);
});

/**
 * 测试目标：doesEventMatchShortcut 应根据组合键判断事件是否触发快捷键。
 * 前置条件：快捷键为 CONTROL+SHIFT+P，事件匹配该组合。
 * 步骤：
 *  1) 调用 doesEventMatchShortcut；
 * 断言：
 *  - 返回 true 表示触发；
 * 边界/异常：
 *  - 若事件缺少修饰键则返回 false（由其他用例覆盖）。
 */
test("Given matching event When checking shortcut Then returns true", () => {
  const event = {
    key: "P",
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: true,
  };
  expect(doesEventMatchShortcut(["CONTROL", "SHIFT", "P"], event)).toBe(true);
});

/**
 * 测试目标：mergeShortcutLists 应将服务端返回与默认蓝本合并。
 * 前置条件：传入仅覆盖 FOCUS_SEARCH 的列表。
 * 步骤：
 *  1) 调用 mergeShortcutLists；
 * 断言：
 *  - 返回长度与 DEFAULT_SHORTCUTS 一致；
 *  - 覆盖项被替换，其余保持默认。
 * 边界/异常：
 *  - 传入 undefined 时返回默认蓝本。
 */
test("Given partial overrides When merging shortcuts Then defaults are preserved", () => {
  const merged = mergeShortcutLists([
    { action: "FOCUS_SEARCH", keys: ["control", "shift", "p"] },
  ]);
  expect(merged).toHaveLength(DEFAULT_SHORTCUTS.length);
  expect(merged.find((item) => item.action === "FOCUS_SEARCH").keys).toEqual([
    "CONTROL",
    "SHIFT",
    "P",
  ]);
  expect(merged.find((item) => item.action === "TOGGLE_THEME").keys).toEqual([
    "MOD",
    "SHIFT",
    "M",
  ]);
});

/**
 * 测试目标：translateShortcutAction 应依据国际化文案返回动作名称。
 * 前置条件：提供包含部分词条的翻译对象。
 * 步骤：
 *  1) 调用 translateShortcutAction；
 * 断言：
 *  - 已配置的键返回翻译；
 *  - 未配置的键返回动作名。
 * 边界/异常：
 *  - t 对象缺失时返回默认文案。
 */
test("Given translations When mapping action Then returns localized label", () => {
  const t = {
    shortcutsFocusSearch: "Focus",
    settingsKeyboardOpenPalette: "Open panel",
  };
  expect(translateShortcutAction(t, "FOCUS_SEARCH")).toBe("Focus");
  expect(translateShortcutAction(t, "OPEN_SHORTCUTS")).toBe("Open panel");
  expect(translateShortcutAction({}, "UNKNOWN_ACTION")).toBe("UNKNOWN_ACTION");
});
