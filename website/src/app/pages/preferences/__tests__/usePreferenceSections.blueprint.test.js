/**
 * 背景：
 *  - 偏好设置 Hook 原有蓝图、导航等场景集中在单一测试文件，阅读与维护成本高。
 * 目的：
 *  - 聚焦验证分区编排与导航元数据，保障拆分后行为保持一致。
 * 关键决策与取舍：
 *  - 依赖共享装配器构建上下文，避免重复 mock 逻辑；
 *  - 以功能场景（蓝图/导航）切分测试文件，维持 500 行结构守卫。
 * 影响范围：
 *  - 偏好设置页面蓝图与导航行为的回归覆盖。
 * 演进与TODO：
 *  - 若新增分区或导航策略，可在此文件追加场景断言。
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  createPreferenceSectionsTestContext,
  loadPreferenceSectionsModules,
} from "../testing/usePreferenceSections.fixtures.js";

let usePreferenceSections;
let ACCOUNT_USERNAME_FIELD_TYPE;
let activeContext;

const setupContext = (options) => {
  if (activeContext) {
    activeContext.restore();
  }
  activeContext = createPreferenceSectionsTestContext(options);
  return activeContext;
};

beforeAll(async () => {
  ({ usePreferenceSections, ACCOUNT_USERNAME_FIELD_TYPE } =
    await loadPreferenceSectionsModules());
});

afterEach(() => {
  if (activeContext) {
    activeContext.restore();
    activeContext = undefined;
  }
});

/**
 * 测试目标：默认渲染时分区顺序应为 general→response style→data→keyboard→account→subscription，且默认激活 general。
 * 前置条件：使用默认语言文案与账户信息渲染 Hook。
 * 步骤：
 *  1) 渲染 usePreferenceSections；
 *  2) 读取 sections 与 panel 结构。
 * 断言：
 *  - sections 顺序符合蓝图；
 *  - activeSectionId 为 general；
 *  - focusHeadingId 与 headingId 指向 general 分区；
 *  - responseStyle 分区未暴露描述信息，message 应为 undefined；
 *  - modalHeadingText 等于 General 文案。
 * 边界/异常：
 *  - 若 general 被禁用，应回退到下一个可用分区（由 sanitizeActiveSectionId 覆盖）。
 */
test("Given default sections When reading blueprint Then general leads navigation", async () => {
  const context = setupContext();
  const { result } = renderHook(() =>
    usePreferenceSections({
      initialSectionId: undefined,
    }),
  );

  await waitFor(() => {
    expect(context.fetchProfileMock).toHaveBeenCalledWith({ token: "token-123" });
  });

  await waitFor(() => {
    const responseStyleSection = result.current.sections.find(
      (section) => section.id === "responseStyle",
    );
    expect(responseStyleSection.componentProps.state.status).toBe("ready");
    expect(responseStyleSection.componentProps.message).toBeUndefined();
  });

  expect(result.current.sections.map((section) => section.id)).toEqual([
    "general",
    "responseStyle",
    "data",
    "keyboard",
    "account",
    "subscription",
  ]);
  expect(result.current.activeSectionId).toBe("general");
  expect(result.current.panel.headingId).toBe("general-section-heading");
  expect(result.current.panel.focusHeadingId).toBe("general-section-heading");
  expect(result.current.panel.modalHeadingId).toBe("settings-modal-fallback-heading");
  expect(result.current.panel.modalHeadingText).toBe("General");
  const accountSection = result.current.sections.find(
    (section) => section.id === "account",
  );
  expect(accountSection).toBeDefined();
  expect(accountSection.Component).toBeDefined();
  expect(accountSection.componentProps.identity.displayName).toBe("amy");
  expect(accountSection.componentProps.identity.changeLabel).toBe(
    context.translations.changeAvatar,
  );
  expect(accountSection.componentProps.identity.avatarAlt).toBe(
    context.translations.prefAccountTitle,
  );
  expect(typeof accountSection.componentProps.identity.onSelectAvatar).toBe("function");
  expect(accountSection.componentProps.identity.isUploading).toBe(false);
  expect(accountSection.componentProps.fields[0].type).toBe(
    ACCOUNT_USERNAME_FIELD_TYPE,
  );
  expect(
    accountSection.componentProps.fields[0].usernameEditorProps,
  ).toMatchObject({
    username: "amy",
  });
  expect(accountSection.componentProps.bindings.title).toBe(
    context.translations.settingsAccountBindingTitle,
  );
  expect(accountSection.componentProps.bindings.items).toHaveLength(3);
  expect(
    accountSection.componentProps.bindings.items.map((item) => item.name),
  ).toEqual([
    context.translations.settingsAccountBindingApple,
    context.translations.settingsAccountBindingGoogle,
    context.translations.settingsAccountBindingWeChat,
  ]);
  expect(
    accountSection.componentProps.bindings.items.every(
      (item) =>
        item.status === context.translations.settingsAccountBindingStatusUnlinked &&
        item.actionLabel ===
          context.translations.settingsAccountBindingActionPlaceholder,
    ),
  ).toBe(true);
  expect(result.current.avatarEditor).toBeDefined();
  expect(typeof result.current.avatarEditor.modalProps.onConfirm).toBe("function");
  expect(result.current.avatarEditor.modalProps.open).toBe(false);
  const subscriptionSection = result.current.sections.find(
    (section) => section.id === "subscription",
  );
  expect(subscriptionSection).toBeDefined();
  expect(subscriptionSection.Component).toBeDefined();
  expect(subscriptionSection.componentProps.planCards).toHaveLength(3);
  expect(
    subscriptionSection.componentProps.planCards.some(
      (card) => card.id === "PLUS" && card.state === "current",
    ),
  ).toBe(true);
  const responseStyleSection = result.current.sections.find(
    (section) => section.id === "responseStyle",
  );
  expect(responseStyleSection.componentProps.copy.dropdownLabel).toBe(
    context.translations.responseStyleSelectLabel,
  );
  expect(responseStyleSection.componentProps.copy.options).toHaveLength(5);
  expect(
    responseStyleSection.componentProps.copy.fields.map((field) => field.id),
  ).toEqual(["job", "education", "currentAbility", "goal", "interests"]);
  expect(
    responseStyleSection.componentProps.copy.fields
      .filter((field) => field.multiline)
      .map((field) => field.id),
  ).toEqual(["goal", "interests"]);
  expect(
    responseStyleSection.componentProps.copy.fields.find(
      (field) => field.id === "goal",
    ).rows,
  ).toBe(3);
  expect(responseStyleSection.componentProps.state.values.goal).toBe("B2");
  expect(responseStyleSection.componentProps.state.values.responseStyle).toBe(
    "default",
  );
  expect(result.current.feedback.redeemToast).toMatchObject({
    open: false,
    message: "",
    closeLabel: context.translations.toastDismissLabel,
    duration: 3000,
  });
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
  expect(result.current.panel.modalHeadingId).toBe("settings-modal-fallback-heading");
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
