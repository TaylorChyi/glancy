import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { jest } from "@jest/globals";

const mockUseTheme = jest.fn();

jest.unstable_mockModule("@core/context", () => ({
  useTheme: mockUseTheme,
}));

let ActionInputView;

beforeAll(async () => {
  ({ default: ActionInputView } = await import("../parts/ActionInputView.jsx"));
});

beforeEach(() => {
  mockUseTheme.mockReturnValue({
    theme: "system",
    resolvedTheme: "light",
    setTheme: () => {},
  });
});

afterEach(() => {
  mockUseTheme.mockReset();
});

/**
 * 测试目标：视图层在注入标准 Props 时渲染结构保持稳定。
 * 前置条件：提供最小可用的 formProps、textareaProps、语言区与动作区状态。
 * 步骤：
 *  1) 构造 props 并渲染组件。
 *  2) 捕获渲染输出进行快照。
 * 断言：
 *  - 快照与基准一致，证明视图未引入额外逻辑。
 * 边界/异常：
 *  - 语言区隐藏与否由 snapshot 体现，确保布尔条件生效。
 */
test("GivenStandardProps_WhenRenderingView_ThenMatchSnapshot", () => {
  const formRef = createRef();
  const { container } = render(
    <ActionInputView
      formProps={{ ref: formRef, onSubmit: jest.fn() }}
      textareaProps={{
        ref: jest.fn(),
        rows: 2,
        placeholder: "Say something",
        value: "example",
        onChange: jest.fn(),
        onKeyDown: jest.fn(),
        onFocus: jest.fn(),
        onBlur: jest.fn(),
      }}
      languageControls={{
        isVisible: true,
        props: {
          sourceLanguage: "ZH",
          sourceLanguageOptions: [
            { value: "ZH", label: "中文" },
            { value: "EN", label: "英文" },
          ],
          sourceLanguageLabel: "源语言",
          onSourceLanguageChange: jest.fn(),
          targetLanguage: "EN",
          targetLanguageOptions: [
            { value: "EN", label: "英文" },
            { value: "ZH", label: "中文" },
          ],
          targetLanguageLabel: "目标语言",
          onTargetLanguageChange: jest.fn(),
          onSwapLanguages: jest.fn(),
          swapLabel: "交换语向",
          normalizeSourceLanguage: jest.fn((value) => value),
          normalizeTargetLanguage: jest.fn((value) => value),
          onMenuOpen: jest.fn(),
        },
      }}
      actionButtonProps={{
        canSubmit: true,
        onSubmit: jest.fn(),
        sendLabel: "发送",
        restoreFocus: jest.fn(),
      }}
    />,
  );

  const sendIcon = container.querySelector('[data-icon-name="send-button"]');
  expect(sendIcon).not.toBeNull();

  expect(container).toMatchSnapshot();
});

/**
 * 测试目标：语言触发按钮应渲染三点三角图标并保留可达性标识。
 * 前置条件：提供可见的语言控件与中英选项。
 * 步骤：
 *  1) 渲染组件并定位语言触发按钮。
 *  2) 校验按钮内部的 SVG data 标识。
 * 断言：
 *  - 触发按钮 aria-label 组合源/目标语标签；
 *  - SVG data-icon-name === language-triad，证明图标渲染成功。
 * 边界/异常：
 *  - 若图标缺失将导致交互入口难以辨识，应阻止回归上线。
 */
test("GivenLanguageControlsVisible_WhenRendering_ThenExposeTriadIcon", () => {
  const formRef = createRef();
  render(
    <ActionInputView
      formProps={{ ref: formRef, onSubmit: jest.fn() }}
      textareaProps={{
        ref: jest.fn(),
        rows: 2,
        placeholder: "Say something",
        value: "example",
        onChange: jest.fn(),
        onKeyDown: jest.fn(),
        onFocus: jest.fn(),
        onBlur: jest.fn(),
      }}
      languageControls={{
        isVisible: true,
        props: {
          sourceLanguage: "ZH",
          sourceLanguageOptions: [
            { value: "ZH", label: "中文" },
            { value: "EN", label: "英文" },
          ],
          sourceLanguageLabel: "源语言",
          onSourceLanguageChange: jest.fn(),
          targetLanguage: "EN",
          targetLanguageOptions: [
            { value: "EN", label: "英文" },
            { value: "ZH", label: "中文" },
          ],
          targetLanguageLabel: "目标语言",
          onTargetLanguageChange: jest.fn(),
          onSwapLanguages: jest.fn(),
          swapLabel: "交换语向",
          normalizeSourceLanguage: jest.fn((value) => value),
          normalizeTargetLanguage: jest.fn((value) => value),
          onMenuOpen: jest.fn(),
        },
      }}
      actionButtonProps={{
        canSubmit: true,
        onSubmit: jest.fn(),
        sendLabel: "发送",
        restoreFocus: jest.fn(),
      }}
    />,
  );

  const triggerButton = screen.getByRole("button", { name: "源语言 → 目标语言" });
  const icon = triggerButton.querySelector('[data-icon-name="language-triad"]');

  expect(triggerButton).not.toBeNull();
  expect(icon).not.toBeNull();
  expect(triggerButton.getAttribute("data-open")).toBeNull();
});

/**
 * 测试目标：当语言区隐藏且禁用发送时，结构应折叠且按钮进入禁用态。
 * 前置条件：languageControls.isVisible=false、canSubmit=false。
 * 步骤：
 *  1) 渲染组件并读取 data-language-visible 属性。
 *  2) 断言语言槽位被折叠。
 *  3) 校验动作按钮被禁用，表明无语音后备路径。
 * 断言：
 *  - data-language-visible === "false"。
 *  - language-slot 不包含子节点并具有 data-visible="false"。
 *  - divider 在此场景下被移除，避免冗余列。
 *  - 按钮 disabled 属性存在。
 * 边界/异常：
 *  - 折叠逻辑纯展示层处理，不依赖额外行为。
 */
test("GivenLanguageControlsHidden_WhenRendering_ThenCollapseLanguageSlot", () => {
  const formRef = createRef();
  const onSubmit = jest.fn();
  const { container } = render(
    <ActionInputView
      formProps={{ ref: formRef, onSubmit }}
      textareaProps={{
        ref: jest.fn(),
        rows: 2,
        placeholder: "",
        value: "",
        onChange: jest.fn(),
        onKeyDown: jest.fn(),
        onFocus: jest.fn(),
        onBlur: jest.fn(),
      }}
      languageControls={{
        isVisible: false,
        props: {
          sourceLanguage: undefined,
          sourceLanguageOptions: [],
          targetLanguage: undefined,
          targetLanguageOptions: [],
        },
      }}
      actionButtonProps={{
        canSubmit: false,
        onSubmit: jest.fn(),
        sendLabel: "发送",
        restoreFocus: jest.fn(),
      }}
    />,
  );

  const surface = container.querySelector(`.${"input-surface"}`);
  expect(surface?.getAttribute("data-language-visible")).toBe("false");

  const languageSlot = container.querySelector(`.${"language-slot"}`);
  expect(languageSlot).not.toBeNull();
  expect(languageSlot?.getAttribute("data-visible")).toBe("false");
  expect(languageSlot?.childElementCount ?? 0).toBe(0);

  const divider = container.querySelector(`.${"input-divider"}`);
  expect(divider).toBeNull();

  const actionButton = container.querySelector(`.${"action-slot"} button`);
  expect(actionButton?.getAttribute("disabled")).toBe("");
});

/**
 * 测试目标：暗色主题下的发送态按钮应加载 send-button 资源并暴露一致蒙版。
 * 前置条件：resolvedTheme 为 dark，输入区值非空。
 * 步骤：
 *  1) 通过 mocked useTheme 注入暗色主题。
 *  2) 渲染组件并获取动作按钮与内部图标。
 * 断言：
 *  - send-button 图标被渲染且拥有蒙版样式。
 *  - 快照稳定，覆盖暗色主题下的发送按钮结构。
 * 边界/异常：
 *  - 若暗色资源缺失则自动回退，测试将捕获为空的情况。
 */
test("GivenDarkTheme_WhenRenderingSendState_ThenExposeSendButtonIcon", () => {
  mockUseTheme.mockReturnValue({
    theme: "system",
    resolvedTheme: "dark",
    setTheme: () => {},
  });
  const formRef = createRef();
  const { container } = render(
    <ActionInputView
      formProps={{ ref: formRef, onSubmit: jest.fn() }}
      textareaProps={{
        ref: jest.fn(),
        rows: 2,
        placeholder: "",
        value: "dark theme message",
        onChange: jest.fn(),
        onKeyDown: jest.fn(),
        onFocus: jest.fn(),
        onBlur: jest.fn(),
      }}
      languageControls={{
        isVisible: false,
        props: {
          sourceLanguage: undefined,
          sourceLanguageOptions: [],
          targetLanguage: undefined,
          targetLanguageOptions: [],
        },
      }}
      actionButtonProps={{
        canSubmit: true,
        onSubmit: jest.fn(),
        sendLabel: "发送",
        restoreFocus: jest.fn(),
      }}
    />,
  );

  const sendIcon = container.querySelector('[data-icon-name="send-button"]');
  expect(sendIcon).not.toBeNull();
  expect(sendIcon?.tagName).toBe("SPAN");
  expect(sendIcon?.getAttribute("data-render-mode")).toBe("inline");
  expect(sendIcon?.getAttribute("data-icon-name")).toBe("send-button");

  const sendButton = container.querySelector(`.${"action-slot"} button`);
  expect(sendButton).toMatchSnapshot("DarkSendActionButtonMarkup");
});
