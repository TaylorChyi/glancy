import { act, renderHook, waitFor } from "@testing-library/react";
import {
  createPreferenceSectionsBlueprintTestkit,
} from "./preferenceSectionsBlueprintTestkit.js";
import { loadPreferenceSectionsModules } from "../testing/usePreferenceSections.fixtures.js";

let usePreferenceSections;
let ACCOUNT_USERNAME_FIELD_TYPE;
let blueprintTestkit;
let setupContext;
let runDefaultBlueprintScenario;
let defaultBlueprintExpectations;

beforeAll(async () => {
  ({ usePreferenceSections, ACCOUNT_USERNAME_FIELD_TYPE } =
    await loadPreferenceSectionsModules());
  blueprintTestkit = createPreferenceSectionsBlueprintTestkit({
    usePreferenceSections,
    ACCOUNT_USERNAME_FIELD_TYPE,
  });
  ({
    setupContext,
    runDefaultBlueprintScenario,
    defaultBlueprintExpectations,
  } = blueprintTestkit);
});

afterEach(() => {
  blueprintTestkit?.teardown();
});

/**
 * 测试目标：默认渲染时的蓝图应确保导航顺序、账号/订阅分区与响应风格元数据均符合设计文档。
 * 方案拆解：Given/When 阶段通过 runDefaultBlueprintScenario 统一准备上下文，再使用 test.each 将各个断言主题拆分到独立 Then helper 中。
 * 断言：
 *  - general 领衔导航；
 *  - account section 注入身份与绑定信息；
 *  - subscription section 提供预期套餐；
 *  - response style section 填充表单文案与默认值；
 *  - avatar editor 与 toast 元数据符合默认值。
 */
describe("default preference sections blueprint", () => {
  test.each(defaultBlueprintExpectations)(
    "Given default sections When reading blueprint Then $expectation",
    async ({ assertThen }) => {
      const scenario = await runDefaultBlueprintScenario();
      await assertThen(scenario);
    },
  );
});

/**
 * 测试目标：当传入历史分区 ID 时，应回退至首个可用分区以维持导航可用性。
 * 前置条件：initialSectionId 指向已下线的 privacy 分区。
 * 步骤：
 *  1) 渲染 usePreferenceSections 并读取激活分区。
 * 断言：
 *  - activeSectionId 回退为 general；
 *  - panel.headingId 对应 general 分区。
 * 边界/异常：
 *  - 若 general 被禁用，应回退到下一个可用分区（由 sanitizeActiveSectionId 负责）。
 */
test("Given legacy section id When initializing Then selection falls back to general", () => {
  setupContext();
  const { result } = renderHook(() =>
    usePreferenceSections({
      initialSectionId: "privacy",
    }),
  );

  expect(result.current.activeSectionId).toBe("general");
  expect(result.current.panel.headingId).toBe("general-section-heading");
});

/**
 * 测试目标：当分区标题文案为空白时，模态备用标题应回退至 copy.title。
 * 前置条件：快捷键分区标题与摘要均为空白字符串。
 * 步骤：
 *  1) 使用覆盖文案的语言包渲染 Hook，并指定初始分区为 keyboard。
 *  2) 读取 panel 对象中的标题字段。
 * 断言：
 *  - modalHeadingText 等于 copy.title；
 *  - focusHeadingId 指向 keyboard 分区 heading。
 * 边界/异常：
 *  - 若 copy.title 为空，也应保持非空字符串（由 Hook 内默认值保障）。
 */
test("Given blank section titles When resolving modal heading Then fallback title is used", () => {
  setupContext({
    translationOverrides: {
      settingsTabKeyboard: "   ",
      settingsKeyboardDescription: "   ",
    },
  });

  const { result } = renderHook(() =>
    usePreferenceSections({
      initialSectionId: "keyboard",
    }),
  );

  expect(result.current.panel.focusHeadingId).toBe("keyboard-section-heading");
  expect(result.current.panel.modalHeadingText).toBe(result.current.copy.title);
  expect(result.current.panel.modalHeadingId).toBe(
    "settings-modal-fallback-heading",
  );
});

/**
 * 测试目标：当键盘分区未提供描述时，应移除面板描述语义以避免空引用。
 * 前置条件：使用默认翻译渲染 Hook，并激活 keyboard 分区。
 * 步骤：
 *  1) 指定 initialSectionId 为 keyboard 渲染 Hook；
 * 断言：
 *  - activeSection 不再暴露 message 属性；
 *  - panel.descriptionId 为 undefined。
 * 边界/异常：
 *  - 若未来恢复描述，应同步更新该断言。
 */
test("Given keyboard section without summary When rendering Then panel description id clears", () => {
  setupContext();
  const { result } = renderHook(() =>
    usePreferenceSections({
      initialSectionId: "keyboard",
    }),
  );

  expect(result.current.activeSection?.componentProps?.message).toBeUndefined();
  expect(result.current.panel.descriptionId).toBeUndefined();
});

/**
 * 测试目标：切换分区后备用标题随激活分区更新。
 * 前置条件：默认激活 general 分区。
 * 步骤：
 *  1) 渲染 Hook 并调用 handleSectionSelect 选择 data 分区；
 *  2) 读取 panel 的标题字段。
 * 断言：
 *  - modalHeadingText 更新为 Data controls 文案；
 *  - focusHeadingId 更新为 data-section-heading。
 * 边界/异常：
 *  - 若分区被禁用，handleSectionSelect 应忽略状态变更（此处不触发）。
 */
test("Given section switch When selecting data Then heading metadata updates", async () => {
  setupContext();
  const { result } = renderHook(() =>
    usePreferenceSections({
      initialSectionId: undefined,
    }),
  );

  act(() => {
    result.current.handleSectionSelect({ id: "data", disabled: false });
  });

  expect(result.current.activeSectionId).toBe("data");

  await waitFor(() => {
    expect(result.current.panel.focusHeadingId).toBe("data-section-heading");
    expect(result.current.panel.modalHeadingText).toBe("Data controls");
  });
});
