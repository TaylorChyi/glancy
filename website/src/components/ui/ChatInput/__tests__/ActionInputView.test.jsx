import { render } from "@testing-library/react";
import { createRef } from "react";
import { jest } from "@jest/globals";

const mockUseTheme = jest.fn();

jest.unstable_mockModule("@/context", () => ({
  useTheme: mockUseTheme,
}));

const { default: ActionInputView } = await import("../parts/ActionInputView.jsx");

beforeEach(() => {
  mockUseTheme.mockReturnValue({ theme: "system", resolvedTheme: "light", setTheme: () => {} });
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
 *  3) 抽取语言代码标识，确认挂载宽度约束类名。
 * 断言：
 *  - 快照与基准一致，证明视图未引入额外逻辑。
 *  - language-trigger-code 类名存在，以保障 4ch 的宽度策略。
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
        value: "example",
        isRecording: false,
        voiceCooldownRef: { current: 0 },
        onVoice: jest.fn(),
        onSubmit: jest.fn(),
        isVoiceDisabled: false,
        sendLabel: "发送",
        voiceLabel: "语音",
      }}
    />,
  );

  const sendIcon = container.querySelector('[data-icon-name="send-button"]');
  expect(sendIcon).not.toBeNull();

  const languageCodeBadges = Array.from(
    container.querySelectorAll(`.${"language-trigger-code"}`),
  );
  expect(languageCodeBadges.length).toBeGreaterThan(0);
  languageCodeBadges.forEach((badge) => {
    expect(badge.classList.contains("language-trigger-code")).toBe(true);
  });

  expect(container).toMatchSnapshot();
});

/**
 * 测试目标：当语言区隐藏时，网格属性与语义标记应正确折叠。
 * 前置条件：languageControls.isVisible=false。
 * 步骤：
 *  1) 渲染组件并读取 data-language-visible 属性。
 *  2) 断言语言槽位与分隔符均被折叠。
 *  3) 捕获动作按钮，确认语音图标结构与语义标识。
 * 断言：
 *  - data-language-visible === "false"。
 *  - language-slot 不包含子节点并具有 data-visible="false"。
 *  - divider 在此场景下被移除，避免冗余列。
 *  - 语音态按钮包含标记为 voice-button 的图标。
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
        value: "",
        isRecording: false,
        voiceCooldownRef: { current: 0 },
        onSubmit: jest.fn(),
        isVoiceDisabled: true,
        sendLabel: "发送",
        voiceLabel: "语音",
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
  expect(divider?.getAttribute("data-visible")).toBe("false");

  const voiceIcon = container.querySelector('[data-icon-name="voice-button"]');
  expect(voiceIcon).not.toBeNull();
  expect(voiceIcon?.classList.contains("action-button-icon")).toBe(true);

  const actionButton = container.querySelector(`.${"action-slot"} button`);
  expect(actionButton).toMatchSnapshot("VoiceActionButtonMarkup");
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
  mockUseTheme.mockReturnValue({ theme: "system", resolvedTheme: "dark", setTheme: () => {} });
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
        value: "dark theme message",
        isRecording: false,
        voiceCooldownRef: { current: 0 },
        onVoice: jest.fn(),
        onSubmit: jest.fn(),
        isVoiceDisabled: false,
        sendLabel: "发送",
        voiceLabel: "语音",
      }}
    />,
  );

  const sendIcon = container.querySelector('[data-icon-name="send-button"]');
  expect(sendIcon).not.toBeNull();
  expect(sendIcon?.getAttribute("data-icon-name")).toBe("send-button");
  expect(sendIcon?.getAttribute("style") ?? "").toContain("mask: url(");

  const sendButton = container.querySelector(`.${"action-slot"} button`);
  expect(sendButton).toMatchSnapshot("DarkSendActionButtonMarkup");
});
