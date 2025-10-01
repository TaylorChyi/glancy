import { render } from "@testing-library/react";
import { createRef } from "react";
import { jest } from "@jest/globals";

import ActionInputView from "../parts/ActionInputView.jsx";

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

  expect(container).toMatchSnapshot();
});

/**
 * 测试目标：当语言区隐藏时，网格属性与语义标记应正确折叠。
 * 前置条件：languageControls.isVisible=false。
 * 步骤：
 *  1) 渲染组件并读取 data-language-visible 属性。
 *  2) 断言语言槽位与分隔符均被折叠。
 * 断言：
 *  - data-language-visible === "false"。
 *  - language-slot 不包含子节点并具有 data-visible="false"。
 *  - divider 在此场景下被移除，避免冗余列。
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
});
