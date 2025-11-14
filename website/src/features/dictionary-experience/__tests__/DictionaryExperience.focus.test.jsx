/* eslint-env jest */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { createFocusTestHarness } from "./test-helpers/focusHarness.js";

jest.unstable_mockModule("../hooks/useDictionaryExperience.js", () => ({
  __esModule: true,
  useDictionaryExperience: jest.fn(),
}));

jest.unstable_mockModule("@shared/components/Layout", () => ({
  __esModule: true,
  default: ({ bottomContent, children }) => (
    <div
      data-testid="layout-root"
      data-has-bottom={bottomContent ? "yes" : "no"}
    >
      {bottomContent ? (
        <div data-testid="layout-bottom-content">{bottomContent}</div>
      ) : null}
      <div>{children}</div>
    </div>
  ),
}));

jest.unstable_mockModule("@app/pages/App/LibraryLandingView.jsx", () => ({
  __esModule: true,
  default: ({ label }) => (
    <div data-testid="library-landing">{label || "致用单词"}</div>
  ),
}));

jest.unstable_mockModule("@shared/components/ui/HistoryDisplay", () => ({
  __esModule: true,
  default: () => null,
}));

jest.unstable_mockModule("@shared/components/ui/DictionaryEntry", () => ({
  __esModule: true,
  default: () => <div data-testid="dictionary-entry" />,
  DictionaryEntryView: () => <div data-testid="dictionary-entry" />,
}));

jest.unstable_mockModule("@shared/components/ui/ChatInput", async () => {
  const ReactModule = await import("react");
  const { default: useActionInputBehavior } = await import(
    "@shared/components/ui/ChatInput/hooks/useActionInputBehavior"
  );

  function MockChatInput(props) {
    const behavior = useActionInputBehavior(props);
    const { formProps, textareaProps, actionButtonProps } = behavior;

    const handleActionClick = ReactModule.useCallback(
      (event) => {
        event.preventDefault();
        if (!actionButtonProps.canSubmit) {
          return;
        }
        actionButtonProps.onSubmit?.();
        actionButtonProps.restoreFocus();
      },
      [actionButtonProps],
    );

    return (
      <form
        ref={formProps.ref}
        onSubmit={formProps.onSubmit}
        data-testid="dictionary-chat-input-form"
      >
        <textarea {...textareaProps} data-testid="dictionary-chat-input" />
        <button
          type="button"
          onClick={handleActionClick}
          disabled={!actionButtonProps.canSubmit}
        >
          {actionButtonProps.sendLabel}
        </button>
      </form>
    );
  }

  MockChatInput.displayName = "MockChatInput";

  return {
    __esModule: true,
    default: MockChatInput,
  };
});

jest.unstable_mockModule("@shared/components/ui/ICP", () => ({
  __esModule: true,
  default: () => null,
  DockedICP: () => null,
}));

jest.unstable_mockModule("@shared/components/ui/EmptyState", () => ({
  __esModule: true,
  default: () => null,
}));

jest.unstable_mockModule("@shared/components/ui/MessagePopup", () => ({
  __esModule: true,
  default: () => null,
}));

jest.unstable_mockModule("../components/BottomPanelSwitcher.jsx", () => ({
  __esModule: true,
  default: ({ mode, searchContent, actionsContent }) => (
    <div data-testid="bottom-panel">
      {mode === "search" ? searchContent : actionsContent}
    </div>
  ),
}));

jest.unstable_mockModule("../components/panels/ActionPanel.jsx", () => ({
  __esModule: true,
  default: ({ onRequestSearch, searchButtonLabel, actionBarProps }) => (
    <div>
      <button type="button" onClick={onRequestSearch}>
        {searchButtonLabel}
      </button>
      {actionBarProps?.onReoutput ? (
        <button type="button" onClick={actionBarProps.onReoutput}>
          重试释义
        </button>
      ) : null}
    </div>
  ),
}));

const DictionaryExperience = (await import("../DictionaryExperience.jsx"))
  .default;
const { useDictionaryExperience } = await import(
  "../hooks/useDictionaryExperience.js"
);

const {
  renderExperience,
  clickButtonByLabel,
  expectSearchModeWithFocus,
  performRetryFromActionsPanel,
  switchToSearchMode,
  focusTextarea,
  expectRetryHandlerCalled,
  reset,
  buildExperienceState,
} = createFocusTestHarness({
  DictionaryExperience,
  useDictionaryExperience,
});

function setupFocusTestReset() {
  beforeEach(() => {
    reset();
  });
}

describe("DictionaryExperience focus management - focus recovery", () => {
  setupFocusTestReset();

  /**
   * 测试目标：验证从操作面板切换回搜索模式时，底部输入框在重新挂载后被聚焦。
   */
  it("Given_actionsPanel_When_switchBackToSearch_Then_focusesChatInputAfterRemount", async () => {
    const { user, initialFocusCalls } = renderExperience();

    await clickButtonByLabel(user, "返回搜索");

    await expectSearchModeWithFocus(initialFocusCalls);
  });

  /**
   * 测试目标：验证重试后底部输入框重新获得焦点。
   */
  it("Given_actionsPanel_When_retryDefinition_Then_restoresSearchFocus", async () => {
    const { initialFocusCalls } = await performRetryFromActionsPanel();

    await expectSearchModeWithFocus(initialFocusCalls);
  });
});

describe("DictionaryExperience focus management - retry behaviour", () => {
  setupFocusTestReset();

  /**
   * 测试目标：验证点击“重试释义”按钮会触发重试逻辑。
   */
  it("Given_actionsPanel_When_retryDefinition_Then_callsReoutputHandler", async () => {
    await performRetryFromActionsPanel();

    await expectRetryHandlerCalled();
  });
});

/**
 * 测试目标：当搜索模式下输入为空时，发送按钮应保持禁用并维持焦点。
 * 前置条件：存在释义记录使面板可切换；初始处于动作模式。
 * 步骤：
 *  1) 切换到底部搜索模式并聚焦 textarea；
 *  2) 尝试点击发送按钮；
 * 断言：
 *  - actions 面板不再显示（搜索模式未退回）；
 *  - textarea 保持聚焦；
 *  - 发送回调未被触发。
 * 边界/异常：
 *  - 若未来引入自动补全导致按钮自动启用，需要同步调整断言。
 */
describe("DictionaryExperience focus management - disabled send button", () => {
  setupFocusTestReset();

  it("Given_searchMode_When_sendDisabled_ThenRetainFocusWithoutSubmit", async () => {
    const handleSend = jest.fn();
    const { user } = renderExperience({ handleSend });

    const textarea = await switchToSearchMode(user);
    await focusTextarea(user, textarea);

    const sendButton = screen.getByRole("button", { name: "Send" });
    expect(sendButton).toBeDisabled();
    await clickButtonByLabel(user, "Send");

    expect(handleSend).not.toHaveBeenCalled();
  });
});

/**
 * 测试目标：验证在搜索模式下通过 Enter 提交后，底部面板立即切换至释义模式并清空输入值。
 * 前置条件：词典体验存在释义数据，ChatInput 初始填充非空文本。
 * 步骤：
 *  1) 覆盖 useDictionaryExperience 使 text 为非空且 handleSend 清空文本；
 *  2) 聚焦 textarea；
 *  3) 通过键入 Enter 触发表单提交；
 * 断言：
 *  - ChatInput 被卸载，说明面板进入释义模式；
 *  - “返回搜索”按钮重新出现；
 *  - handleSend 与 setText 被调用一次且文本被清空。
 * 边界/异常：
 *  - 若未来回车提交逻辑新增组合键，需要同步调整触发输入。
 */
describe("DictionaryExperience focus management - search submission", () => {
  setupFocusTestReset();

  it("Given_searchSubmission_When_pressEnter_Then_showActionsAndResetInput", async () => {
    const setTextMock = jest.fn();
    const handleSendMock = jest.fn((event) => {
      event.preventDefault();
      setTextMock("");
    });

    const { user } = renderExperience({
      text: "mock term",
      setText: setTextMock,
      handleSend: handleSendMock,
    });

    expect(
      screen.queryByRole("button", { name: "返回搜索" }),
    ).not.toBeInTheDocument();

    const textarea = screen.getByRole("textbox");
    await focusTextarea(user, textarea);
    await waitFor(() => {
      expect(textarea).toHaveValue("mock term");
    });

    await user.type(textarea, "{enter}");

    await waitFor(() => {
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "返回搜索" }),
      ).toBeInTheDocument();
    });

    expect(handleSendMock).toHaveBeenCalledTimes(1);
    expect(setTextMock).toHaveBeenCalledWith("");
  });
});

/**
 * 测试目标：当视图切换至“致用单词”时，底栏应被移除且占位标签居中展示。
 * 前置条件：useDictionaryExperience 返回 activeView 为 library 的桩数据。
 * 步骤：
 *  1) 通过 mockReturnValueOnce 覆盖 Hook 输出；
 *  2) 渲染 DictionaryExperience；
 * 断言：
 *  - Layout 的 data-has-bottom 属性为 "no"；
 *  - LibraryLandingView 渲染致用单词标签（失败信息：占位文案未呈现）。
 * 边界/异常：
 *  - 若未来 LibraryLandingView 支持更多插槽需同步更新断言。
 */
describe("DictionaryExperience focus management - library view", () => {
  setupFocusTestReset();

  it("Given_libraryView_When_rendered_Then_hidesBottomPanelAndShowsLibraryLabel", () => {
    useDictionaryExperience.mockReturnValueOnce(
      buildExperienceState({
        t: {},
        activeView: "library",
        viewState: {
          active: "library",
          isDictionary: false,
          isHistory: false,
          isLibrary: true,
        },
        focusInput: jest.fn(),
        entry: null,
        dictionaryActionBarProps: { onReoutput: jest.fn() },
        displayClassName: "library-view",
      }),
    );

    render(<DictionaryExperience />);

    expect(screen.getByTestId("layout-root")).toHaveAttribute(
      "data-has-bottom",
      "no",
    );
    expect(screen.getByTestId("library-landing")).toHaveTextContent("致用单词");
  });
});
