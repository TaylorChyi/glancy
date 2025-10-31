/**
 * 背景：
 *  - CSS 模块拆分后通过门面聚合器导出，需防止未来回归导致映射缺失。
 * 目的：
 *  - 校验关键页面/组件复用的样式门面对象保持只读并暴露核心类名。
 * 关键决策与取舍：
 *  - 统一在共享组件测试目录集中验证，避免在各模块重复断言；
 *  - 通过具名断言覆盖代表性 className，若未来替换需同步更新测试。
 * 影响范围：
 *  - 拆分后依赖门面聚合的 UI 组件。
 * 演进与TODO：
 *  - TODO: 后续可引入自动快照对比整个映射，进一步降低回归风险。
 */
import preferencesStyles from "@app/pages/preferences/styles/index.js";
import profileStyles from "@app/pages/profile/styles/index.js";
import reportIssueStyles from "@features/dictionary-experience/components/styles/index.js";
import layoutStyles from "@shared/components/Layout/styles/index.js";
import outputToolbarStyles from "@shared/components/OutputToolbar/styles/index.js";
import emailBindingCardStyles from "@shared/components/Profile/EmailBindingCard/styles/index.js";
import authFormStyles from "@shared/components/form/styles/index.js";
import chatInputStyles from "@shared/components/ui/ChatInput/styles/index.js";

/**
 * 测试目标：Preferences 样式门面应冻结并提供核心布局类。
 * 前置条件：无，直接访问聚合对象。
 * 步骤：
 *  1) 断言 Object.isFrozen 返回 true。
 *  2) 校验 content/tab/panel 三个关键类名存在。
 * 断言：
 *  - 核心类名均存在且为字符串。
 * 边界/异常：
 *  - 若缺失则说明拆分后映射异常，应阻止页面渲染回归。
 */
test("GivenPreferencesFacade_WhenAccessingCoreClasses_ThenExposeFrozenMapping", () => {
  expect(Object.isFrozen(preferencesStyles)).toBe(true);
  expect(typeof preferencesStyles.content).toBe("string");
  expect(typeof preferencesStyles.tab).toBe("string");
  expect(typeof preferencesStyles.panel).toBe("string");
});

/**
 * 测试目标：Profile 样式门面需提供基础布局类并保持只读。
 * 前置条件：无，直接访问聚合对象。
 * 步骤：
 *  1) 校验冻结状态。
 *  2) 检查 basic/icon/actions 三个类名。
 * 断言：
 *  - 类名均存在且类型为字符串。
 * 边界/异常：
 *  - 若任一类名缺失说明 Profile 页面渲染会失真。
 */
test("GivenProfileFacade_WhenCheckingLayoutTokens_ThenExposeExpectedClasses", () => {
  expect(Object.isFrozen(profileStyles)).toBe(true);
  expect(typeof profileStyles.basic).toBe("string");
  expect(typeof profileStyles.icon).toBe("string");
  expect(typeof profileStyles.actions).toBe("string");
});

/**
 * 测试目标：ReportIssueModal 样式门面需保留表单与摘要结构类。
 * 前置条件：无，直接访问聚合对象。
 * 步骤：
 *  1) 校验冻结状态。
 *  2) 检查 header/summary/fieldset 等关键类名。
 * 断言：
 *  - 相关类名存在且类型为字符串。
 * 边界/异常：
 *  - 缺失说明模态布局被破坏，应立即回归。
 */
test("GivenReportIssueFacade_WhenInspectingStructuralClasses_ThenExposeFormMappings", () => {
  expect(Object.isFrozen(reportIssueStyles)).toBe(true);
  expect(typeof reportIssueStyles.header).toBe("string");
  expect(typeof reportIssueStyles.summary).toBe("string");
  expect(typeof reportIssueStyles.fieldset).toBe("string");
});

/**
 * 测试目标：Layout 样式门面应输出应用壳体所需类名。
 * 前置条件：无，直接访问聚合对象。
 * 步骤：
 *  1) 校验冻结状态。
 *  2) 检查 app/main/content 类名。
 * 断言：
 *  - 类名存在且为字符串。
 * 边界/异常：
 *  - 缺失说明布局容器拆分存在遗漏。
 */
test("GivenLayoutFacade_WhenQueryingShellClasses_ThenExposeAppContainers", () => {
  expect(Object.isFrozen(layoutStyles)).toBe(true);
  expect(typeof layoutStyles.app).toBe("string");
  expect(typeof layoutStyles.main).toBe("string");
  expect(typeof layoutStyles.content).toBe("string");
});

/**
 * 测试目标：OutputToolbar 样式门面需提供工具栏与指示器类。
 * 前置条件：无，直接访问聚合对象。
 * 步骤：
 *  1) 校验冻结状态。
 *  2) 检查 toolbar/indicator 类名。
 * 断言：
 *  - 类名存在且类型为字符串。
 * 边界/异常：
 *  - 缺失会导致工具栏排版错乱。
 */
test("GivenOutputToolbarFacade_WhenValidatingEssentials_ThenExposeToolbarClasses", () => {
  expect(Object.isFrozen(outputToolbarStyles)).toBe(true);
  expect(typeof outputToolbarStyles.toolbar).toBe("string");
  expect(typeof outputToolbarStyles.indicator).toBe("string");
});

/**
 * 测试目标：EmailBindingCard 样式门面需覆盖标题、表单与摘要区域。
 * 前置条件：无，直接访问聚合对象。
 * 步骤：
 *  1) 校验冻结状态。
 *  2) 检查 header/form/summary 类名。
 * 断言：
 *  - 目标类名存在且类型为字符串。
 * 边界/异常：
 *  - 缺失说明卡片呈现会异常，应阻断发布。
 */
test("GivenEmailBindingCardFacade_WhenAccessingSections_ThenExposeFormClasses", () => {
  expect(Object.isFrozen(emailBindingCardStyles)).toBe(true);
  expect(typeof emailBindingCardStyles.header).toBe("string");
  expect(typeof emailBindingCardStyles.form).toBe("string");
  expect(typeof emailBindingCardStyles.summary).toBe("string");
});

/**
 * 测试目标：AuthForm 样式门面需输出字段、标签与分隔符类。
 * 前置条件：无，直接访问聚合对象。
 * 步骤：
 *  1) 校验冻结状态。
 *  2) 检查 field/label/divider 类名。
 * 断言：
 *  - 目标类名存在且类型为字符串。
 * 边界/异常：
 *  - 缺失会导致认证表单布局错位。
 */
test("GivenAuthFormFacade_WhenInspectingFormTokens_ThenExposeFieldClasses", () => {
  expect(Object.isFrozen(authFormStyles)).toBe(true);
  expect(typeof authFormStyles.field).toBe("string");
  expect(typeof authFormStyles.label).toBe("string");
  expect(typeof authFormStyles.divider).toBe("string");
});

/**
 * 测试目标：ChatInput 样式门面需提供容器与文本域类。
 * 前置条件：无，直接访问聚合对象。
 * 步骤：
 *  1) 校验冻结状态。
 *  2) 检查 container/textarea 类名。
 * 断言：
 *  - 类名存在且类型为字符串。
 * 边界/异常：
 *  - 缺失会导致 ChatInput 布局失真。
 */
test("GivenChatInputFacade_WhenQueryingShellClasses_ThenExposeContainerTokens", () => {
  expect(Object.isFrozen(chatInputStyles)).toBe(true);
  expect(typeof chatInputStyles.container).toBe("string");
  expect(typeof chatInputStyles.textarea).toBe("string");
});
