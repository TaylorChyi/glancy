import { act, renderHook, waitFor } from "@testing-library/react";
import {
  createPreferenceSectionsTestContext,
  loadPreferenceSectionsModules,
} from "../testing/usePreferenceSections.fixtures.js";

let usePreferenceSections;
let activeContext;

const setupContext = (options) => {
  if (activeContext) {
    activeContext.restore();
  }
  activeContext = createPreferenceSectionsTestContext(options);
  return activeContext;
};

beforeAll(async () => {
  ({ usePreferenceSections } = await loadPreferenceSectionsModules());
});

afterEach(() => {
  if (activeContext) {
    activeContext.restore();
    activeContext = undefined;
  }
});

/**
 * 测试目标：账户信息存在邮箱时偏好设置应暴露可用的解绑操作。
 * 前置条件：mockUseUser 返回包含 email 的用户对象。
 * 步骤：
 *  1) 渲染 usePreferenceSections；
 *  2) 读取 account 分区内 email 字段的操作配置。
 * 断言：
 *  - email 字段 action.disabled 为 false；
 *  - action.label 与翻译词条保持一致。
 * 边界/异常：
 *  - 若分区尚未生成或字段缺失则测试失败。
 */
test("Given bound email When inspecting account field Then unbind action enabled", async () => {
  const context = setupContext();
  const { result } = renderHook(() =>
    usePreferenceSections({ initialSectionId: undefined }),
  );

  await waitFor(() => {
    const accountSection = result.current.sections.find(
      (section) => section.id === "account",
    );
    expect(accountSection).toBeDefined();
  });

  const accountSection = result.current.sections.find(
    (section) => section.id === "account",
  );
  const emailField = accountSection.componentProps.fields.find(
    (field) => field.id === "email",
  );

  expect(emailField).toBeDefined();
  expect(emailField.action).toBeDefined();
  expect(emailField.action.disabled).toBe(false);
  expect(emailField.action.label).toBe(
    context.translations.settingsAccountEmailUnbindAction,
  );
  expect(typeof emailField.action.onClick).toBe("function");
});

/**
 * 测试目标：缺少邮箱时解绑操作需保持禁用，避免误导性交互。
 * 前置条件：mockUseUser 返回 email 为空字符串的用户对象。
 * 步骤：
 *  1) 覆盖 mockUseUser；
 *  2) 渲染 usePreferenceSections 并获取 email 字段。
 * 断言：
 *  - email 字段 action.disabled 为 true。
 * 边界/异常：
 *  - 若 email 字段不存在则测试失败。
 */
test("Given missing email When inspecting account field Then unbind action disabled", async () => {
  setupContext({
    user: {
      email: "",
    },
  });

  const { result } = renderHook(() =>
    usePreferenceSections({ initialSectionId: undefined }),
  );

  await waitFor(() => {
    const accountSection = result.current.sections.find(
      (section) => section.id === "account",
    );
    expect(accountSection).toBeDefined();
  });

  const accountSection = result.current.sections.find(
    (section) => section.id === "account",
  );
  const emailField = accountSection.componentProps.fields.find(
    (field) => field.id === "email",
  );

  expect(emailField).toBeDefined();
  expect(emailField.action).toBeDefined();
  expect(emailField.action.disabled).toBe(true);
});

/**
 * 测试目标：account 分区解绑命令应委托给 useEmailBinding 返回的 unbindEmail。
 * 前置条件：mockUseEmailBinding 返回可解析的 unbindEmail。
 * 步骤：
 *  1) 渲染 Hook；
 *  2) 调用 email 字段 action.onClick。
 * 断言：
 *  - unbindEmailMock 被调用一次；
 * 边界/异常：
 *  - 若 action 缺失或未执行则测试失败。
 */
test("GivenAccountSection_WhenTriggeringEmailAction_ThenDelegateToEmailBinding", async () => {
  const context = setupContext();
  const { result } = renderHook(() =>
    usePreferenceSections({ initialSectionId: undefined }),
  );

  await waitFor(() => {
    const accountSection = result.current.sections.find(
      (section) => section.id === "account",
    );
    expect(accountSection).toBeDefined();
  });

  const accountSection = result.current.sections.find(
    (section) => section.id === "account",
  );
  const emailField = accountSection.componentProps.fields.find(
    (field) => field.id === "email",
  );

  await act(async () => {
    await emailField.action.onClick();
  });

  expect(context.unbindEmailMock).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：解绑流程进行中时按钮需展示等待文案并保持禁用态。
 * 前置条件：mockUseEmailBinding 返回 isUnbinding=true。
 * 步骤：
 *  1) 调整 mockUseEmailBinding 返回值；
 *  2) 渲染 Hook 并读取 email 字段 action。
 * 断言：
 *  - action.isPending 为 true；
 *  - action.pendingLabel 使用翻译词条。
 * 边界/异常：
 *  - 若未生成 email 字段则测试失败。
 */
test("GivenEmailUnbindInFlight_WhenInspectingAction_ThenExposePendingState", async () => {
  const context = setupContext({
    emailBinding: {
      isUnbinding: true,
    },
  });

  const { result } = renderHook(() =>
    usePreferenceSections({ initialSectionId: undefined }),
  );

  await waitFor(() => {
    const accountSection = result.current.sections.find(
      (section) => section.id === "account",
    );
    expect(accountSection).toBeDefined();
  });

  const accountSection = result.current.sections.find(
    (section) => section.id === "account",
  );
  const emailField = accountSection.componentProps.fields.find(
    (field) => field.id === "email",
  );

  expect(emailField.action.isPending).toBe(true);
  expect(emailField.action.pendingLabel).toBe(
    context.translations.settingsAccountEmailUnbinding,
  );
});
