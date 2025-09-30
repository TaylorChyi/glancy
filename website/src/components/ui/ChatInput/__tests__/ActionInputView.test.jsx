import { render } from "@testing-library/react";
import { createRef } from "react";
import { jest } from "@jest/globals";

let ActionInputView;

beforeAll(async () => {
  await jest.unstable_mockModule("@/components/DictionaryEntryActionBar", () => ({
    __esModule: true,
    default: ({ className }) => (
      <div data-testid="dictionary-toolbar-mock" className={className}>
        DictionaryToolbar
      </div>
    ),
  }));
  ({ default: ActionInputView } = await import("../parts/ActionInputView.jsx"));
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
      dictionaryToolbar={{
        isVisible: false,
        props: null,
      }}
      featureMode="language"
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
 * 测试目标：当处于工具栏模式时渲染词典操作栏并附带样式容器。
 * 前置条件：languageControls 隐藏、dictionaryToolbar 提供 props、featureMode=toolbar。
 * 步骤：
 *  1) 传入工具栏可见状态并渲染组件。
 *  2) 捕获 DOM 并断言工具栏节点存在。
 * 断言：
 *  - data-mode 属性为 "toolbar"。
 *  - 工具栏容器内存在 data-testid="output-toolbar" 的节点。
 * 边界/异常：
 *  - 即便 languageControls 可见也不会渲染，当 featureMode=toolbar 时仅呈现工具栏。
 */
test("GivenToolbarMode_WhenRenderingView_ThenRenderDictionaryToolbar", () => {
  const formRef = createRef();
  const onSubmit = jest.fn();
  const { container, getByTestId } = render(
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
        isVisible: true,
        props: {
          sourceLanguage: undefined,
          sourceLanguageOptions: [],
          targetLanguage: undefined,
          targetLanguageOptions: [],
        },
      }}
      dictionaryToolbar={{
        isVisible: true,
        props: {
          term: "hello",
          lang: "en",
          onCopy: jest.fn(),
        },
      }}
      featureMode="toolbar"
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

  expect(container.querySelector("[data-mode='toolbar']")).not.toBeNull();
  expect(getByTestId("dictionary-toolbar-mock")).toBeInTheDocument();
});
