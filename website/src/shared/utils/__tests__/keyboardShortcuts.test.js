import {
  captureKeysFromEvent,
  doesEventMatchShortcut,
  formatShortcutKeys,
  mergeShortcutLists,
  normalizeKeyToken,
  translateShortcutAction,
} from "../keyboardShortcuts.js";

/**
 * 测试目标：验证 normalizeKeyToken 能正确处理常见别名与空输入。
 * 前置条件：提供大小写混合、别名与非法字符的输入集合。
 * 步骤：
 *  1) 调用 normalizeKeyToken 处理不同字符串；
 *  2) 收集返回值。
 * 断言：
 *  - CMD/ctrl/arrow 别名被映射到标准 token；
 *  - 非法字符与空值返回空字符串。
 * 边界/异常：
 *  - 覆盖输入为非字符串的场景，确保函数安全返回空串。
 */
test("normalizeKeyToken handles aliases and invalid input", () => {
  expect(normalizeKeyToken(" cmd ")).toBe("META");
  expect(normalizeKeyToken("ctrl")).toBe("CONTROL");
  expect(normalizeKeyToken("arrowLeft")).toBe("ARROW_LEFT");
  expect(normalizeKeyToken(" ")).toBe("");
  expect(normalizeKeyToken(42)).toBe("");
});

/**
 * 测试目标：验证 captureKeysFromEvent 会输出有序的修饰键及主键。
 * 前置条件：构造带有 ctrl/meta/shift 与字符键的事件桩。
 * 步骤：
 *  1) 传入事件桩；
 *  2) 读取返回的快捷键数组。
 * 断言：
 *  - 修饰键按预期顺序排列；
 *  - 主键位于数组最后且为规范化大写。
 * 边界/异常：
 *  - 若主键与修饰键重复，函数返回 null。
 */
test("captureKeysFromEvent preserves modifier order", () => {
  const event = {
    key: "k",
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: true,
  };
  expect(captureKeysFromEvent(event)).toEqual([
    "CONTROL",
    "SHIFT",
    "K",
  ]);
  expect(captureKeysFromEvent({ ...event, key: "Control" })).toBeNull();
});

/**
 * 测试目标：验证 doesEventMatchShortcut 能正确匹配组合快捷键并过滤多余修饰键。
 * 前置条件：
 *  - 创建匹配的事件对象；
 *  - 创建包含额外修饰键的事件对象。
 * 步骤：
 *  1) 调用 doesEventMatchShortcut 进行匹配；
 *  2) 比较结果。
 * 断言：
 *  - 完全匹配返回 true；
 *  - 多余修饰键导致返回 false。
 * 边界/异常：
 *  - 传入空数组或缺失主键时返回 false。
 */
test("doesEventMatchShortcut validates modifier requirements", () => {
  const matchingEvent = {
    key: "b",
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: true,
  };
  expect(doesEventMatchShortcut(["CTRL", "SHIFT", "b"], matchingEvent)).toBe(
    true,
  );
  expect(
    doesEventMatchShortcut(["CONTROL", "SHIFT", "B"], {
      ...matchingEvent,
      altKey: true,
    }),
  ).toBe(false);
  expect(doesEventMatchShortcut([], matchingEvent)).toBe(false);
});

/**
 * 测试目标：验证 mergeShortcutLists 会合并用户配置并对非法输入保持稳健。
 * 前置条件：提供包含自定义键位及非法 action 的数组。
 * 步骤：
 *  1) 调用 mergeShortcutLists 并读取结果；
 *  2) 定位被覆盖的 action。
 * 断言：
 *  - 自定义 action 覆盖默认键位；
 *  - 非法 action 被忽略且默认值保留。
 * 边界/异常：
 *  - nextShortcuts 不是数组时返回默认值列表。
 */
test("mergeShortcutLists merges custom actions safely", () => {
  const merged = mergeShortcutLists([
    { action: "focus_search", keys: ["mod", "p"] },
    { action: "", keys: ["x"] },
  ]);
  const focusSearch = merged.find((item) => item.action === "FOCUS_SEARCH");
  expect(focusSearch).toEqual({
    action: "FOCUS_SEARCH",
    keys: ["MOD", "P"],
    defaultKeys: ["MOD", "SHIFT", "F"],
  });
});

/**
 * 测试目标：验证 formatShortcutKeys 能根据平台策略与 MOD 文案输出正确标签。
 * 前置条件：提供覆盖 detectApplePlatform 和 resolveModifierKey 的自定义策略。
 * 步骤：
 *  1) 注入自定义策略调用 formatShortcutKeys；
 *  2) 记录返回结果。
 * 断言：
 *  - 修饰键与主键按策略格式化；
 *  - MOD 文案来自注入策略。
 * 边界/异常：
 *  - 输入包含空格键时转换为 "Space"。
 */
test("formatShortcutKeys supports injectable strategies", () => {
  const result = formatShortcutKeys(["mod", "space"], {
    detectApplePlatform: () => false,
    resolveModifierKey: () => "Ctrl",
  });
  expect(result).toEqual(["Ctrl", "Space"]);
});

/**
 * 测试目标：验证 translateShortcutAction 未命中翻译时回退到默认文案。
 * 前置条件：使用空对象作为翻译字典。
 * 步骤：
 *  1) 调用 translateShortcutAction 传入不同动作；
 *  2) 检查返回值。
 * 断言：
 *  - 已知动作返回默认英文文案；
 *  - 未知动作原样返回 action。
 * 边界/异常：
 *  - 传入 undefined 的翻译对象时行为一致。
 */
test("translateShortcutAction falls back to default labels", () => {
  expect(translateShortcutAction({}, "OPEN_SHORTCUTS")).toBe(
    "Open shortcut guide",
  );
  expect(translateShortcutAction(undefined, "CUSTOM_ACTION")).toBe(
    "CUSTOM_ACTION",
  );
});
