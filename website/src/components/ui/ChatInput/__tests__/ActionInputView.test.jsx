import { render } from "@testing-library/react";
import { jest } from "@jest/globals";

await jest.unstable_mockModule("@/components/ui/Popover/Popover.jsx", () => ({
  __esModule: true,
  default: ({ isOpen, children }) => (isOpen ? <div>{children}</div> : null),
}));

const { default: ActionInputView } = await import(
  "@/components/ui/ChatInput/parts/ActionInputView.jsx"
);

/**
 * 测试目标：展示层仅负责组合结构，快照用于守护基础骨架。
 * 前置条件：传入代表性的 props（含语言区与发送态）。
 * 步骤：
 *  1) 渲染 ActionInputView。
 * 断言：
 *  - 输出结构与预期快照一致。
 * 边界/异常：
 *  - 快照偏差提示结构调整需要评审。
 */
test("renders structured layout snapshot", () => {
  const formRef = { current: null };
  const { asFragment } = render(
    <ActionInputView
      formProps={{
        ref: formRef,
        onSubmit: jest.fn(),
      }}
      textareaProps={{
        ref: jest.fn(),
        rows: 2,
        placeholder: "Type here",
        value: "hello",
        onChange: jest.fn(),
        onKeyDown: jest.fn(),
      }}
      actionState={{
        variant: "send",
        ariaLabel: "Send message",
        isPressed: undefined,
        isDisabled: false,
        onAction: jest.fn(),
      }}
      languageState={{
        isVisible: true,
        props: {
          sourceLanguage: "ZH",
          sourceLanguageOptions: [
            { value: "ZH", label: "中文" },
            { value: "EN", label: "English" },
          ],
          sourceLanguageLabel: "源语言",
          onSourceLanguageChange: jest.fn(),
          targetLanguage: "EN",
          targetLanguageOptions: [
            { value: "EN", label: "English" },
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
    />,
  );

  expect(asFragment()).toMatchSnapshot();
});
