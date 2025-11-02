/**
 * 背景：
 *  - 词典体验在释义操作与搜索输入间切换时，存在输入框未及时聚焦的问题。
 * 目的：
 *  - 通过针对 DictionaryExperience 的集成测试，验证搜索模式复位后聚焦逻辑的异步保证。
 * 关键决策与取舍：
 *  - 采用 React Testing Library 渲染实际组件骨架，通过桩件稳定底部面板状态；
 *  - 放弃直接调用内部 Hook，避免对实现细节形成脆弱耦合。
 * 影响范围：
 *  - DictionaryExperience 聚焦行为的回归保障。
 * 演进与TODO：
 *  - 若后续增加更多底部模式，可拓展此文件覆盖多模式切换的聚焦策略。
 */
/* eslint-env jest */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";

const focusInputMock = jest.fn();
const inputRef = { current: null };
const handleReoutputMock = jest.fn();

function createDictionaryExperienceState(overrides = {}) {
  return {
    inputRef,
    t: { returnToSearch: "返回搜索", reoutput: "重试释义" },
    text: "",
    setText: jest.fn(),
    dictionarySourceLanguage: "en",
    setDictionarySourceLanguage: jest.fn(),
    dictionaryTargetLanguage: "zh",
    setDictionaryTargetLanguage: jest.fn(),
    sourceLanguageOptions: [],
    targetLanguageOptions: [],
    handleSwapLanguages: jest.fn(),
    handleSend: jest.fn(),
    handleShowDictionary: jest.fn(),
    handleShowLibrary: jest.fn(),
    handleSelectHistory: jest.fn(),
    activeView: "dictionary",
    viewState: {
      active: "dictionary",
      isDictionary: true,
      isHistory: false,
      isLibrary: false,
    },
    focusInput: focusInputMock,
    entry: { term: "mock" },
    finalText: "",
    streamText: "",
    loading: false,
    dictionaryActionBarProps: { onReoutput: handleReoutputMock },
    displayClassName: "dictionary-experience",
    popupOpen: false,
    popupMsg: "",
    closePopup: jest.fn(),
    toast: null,
    closeToast: jest.fn(),
    dictionaryTargetLanguageLabel: "目标语言",
    dictionarySourceLanguageLabel: "源语言",
    dictionarySwapLanguagesLabel: "切换",
    searchEmptyState: { title: "", description: "" },
    chatInputPlaceholder: "",
    libraryLandingLabel: "致用单词",
    reportDialog: {
      open: false,
      term: "",
      language: "ENGLISH",
      flavor: "BILINGUAL",
      sourceLanguage: "ENGLISH",
      targetLanguage: "CHINESE",
      category: null,
      categories: [],
      description: "",
      submitting: false,
      error: "",
    },
    reportDialogHandlers: {
      close: jest.fn(),
      setCategory: jest.fn(),
      setDescription: jest.fn(),
      submit: jest.fn(),
    },
    ...overrides,
  };
}

jest.unstable_mockModule("../hooks/useDictionaryExperience.js", () => ({
  __esModule: true,
  useDictionaryExperience: jest.fn(() => createDictionaryExperienceState()),
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

jest.unstable_mockModule("../components/DictionaryActionPanel.jsx", () => ({
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

describe("DictionaryExperience focus management", () => {
  beforeEach(() => {
    focusInputMock.mockClear();
    handleReoutputMock.mockClear();
    inputRef.current = null;
    useDictionaryExperience.mockImplementation(() =>
      createDictionaryExperienceState(),
    );
  });

  /**
   * 测试目标：验证从操作面板切换回搜索模式时，底部输入框在重新挂载后被聚焦。
   * 前置条件：useDictionaryExperience 与 useBottomPanelState 被桩件固定为“存在词条且初始模式为 actions”。
   * 步骤：
   *  1) 渲染 DictionaryExperience；
   *  2) 确认初始渲染展示操作面板且未触发 focusInput；
   *  3) 点击“返回搜索”按钮切换到底部搜索模式；
   *  4) 等待 ChatInput 重新挂载并触发聚焦副作用。
   * 断言：
   *  - 初始阶段 focusInput 未被调用；
   *  - 点击按钮后最终调用一次 focusInput。
   * 边界/异常：
   *  - 当输入框 ref 尚未建立时不会触发聚焦，避免空引用异常。
   */
  test("Given_actionsPanel_When_switchBackToSearch_Then_focusesChatInputAfterRemount", async () => {
    const user = userEvent.setup();
    render(<DictionaryExperience />);

    const searchButton = screen.getByRole("button", { name: "返回搜索" });
    const initialFocusCalls = focusInputMock.mock.calls.length;

    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(focusInputMock).toHaveBeenCalledTimes(initialFocusCalls + 1);
    });
  });

  /**
   * 测试目标：验证点击“重试释义”按钮会触发重试逻辑并回落至搜索模式。
   * 前置条件：底部面板初始处于 actions 模式且暴露 onReoutput 回调。
   * 步骤：
   *  1) 渲染 DictionaryExperience 并确认无搜索输入；
   *  2) 点击“重试释义”按钮；
   * 断言：
   *  - onReoutput 被调用一次；
   *  - ChatInput 重新挂载（表示模式切换至 search）；
   *  - focusInput 被再次调用，确保聚焦恢复。
   * 边界/异常：
   *  - 若重试按钮在无释义场景下隐藏，该用例需同步调整前置条件。
   */
  test("Given_actionsPanel_When_retryDefinition_Then_switchToSearchAndFocusInput", async () => {
    const user = userEvent.setup();
    render(<DictionaryExperience />);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: "重试释义" });
    const initialFocusCalls = focusInputMock.mock.calls.length;

    await user.click(retryButton);

    await waitFor(() => {
      expect(handleReoutputMock).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(focusInputMock).toHaveBeenCalledTimes(initialFocusCalls + 1);
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
  test("Given_searchMode_When_sendDisabled_ThenRetainFocusWithoutSubmit", async () => {
    const user = userEvent.setup();
    const handleSend = jest.fn();
    useDictionaryExperience.mockImplementation(() =>
      createDictionaryExperienceState({ handleSend }),
    );

    render(<DictionaryExperience />);

    const searchButton = screen.getByRole("button", { name: "返回搜索" });
    await user.click(searchButton);

    const textarea = await screen.findByRole("textbox");
    await user.click(textarea);
    expect(textarea).toHaveFocus();

    const sendButton = screen.getByRole("button", { name: "Send" });
    expect(sendButton).toBeDisabled();
    await user.click(sendButton);

    expect(handleSend).not.toHaveBeenCalled();
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
  test("Given_searchSubmission_When_pressEnter_Then_showActionsAndResetInput", async () => {
    const user = userEvent.setup();
    const setTextMock = jest.fn();
    const handleSendMock = jest.fn((event) => {
      event.preventDefault();
      setTextMock("");
    });

    useDictionaryExperience.mockImplementation(() =>
      createDictionaryExperienceState({
        text: "mock term",
        setText: setTextMock,
        handleSend: handleSendMock,
      }),
    );

    render(<DictionaryExperience />);

    expect(
      screen.queryByRole("button", { name: "返回搜索" }),
    ).not.toBeInTheDocument();

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    expect(textarea).toHaveFocus();
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
  test("Given_libraryView_When_rendered_Then_hidesBottomPanelAndShowsLibraryLabel", () => {
    useDictionaryExperience.mockReturnValueOnce(
      createDictionaryExperienceState({
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
