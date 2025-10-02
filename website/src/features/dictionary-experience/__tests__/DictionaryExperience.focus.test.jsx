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
import React, { useEffect, useRef } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const focusInputMock = jest.fn();
const inputRef = { current: null };

jest.unstable_mockModule("../hooks/useDictionaryExperience.js", () => ({
  __esModule: true,
  useDictionaryExperience: jest.fn(() => ({
    inputRef,
    t: { returnToSearch: "返回搜索" },
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
    handleVoice: jest.fn(),
    showFavorites: false,
    showHistory: false,
    handleShowDictionary: jest.fn(),
    handleShowFavorites: jest.fn(),
    handleSelectHistory: jest.fn(),
    handleSelectFavorite: jest.fn(),
    handleUnfavorite: jest.fn(),
    favorites: [],
    focusInput: focusInputMock,
    entry: { term: "mock" },
    finalText: "",
    streamText: "",
    loading: false,
    dictionaryActionBarProps: {},
    displayClassName: "dictionary-experience",
    popupOpen: false,
    popupMsg: "",
    closePopup: jest.fn(),
    dictionaryTargetLanguageLabel: "目标语言",
    dictionarySourceLanguageLabel: "源语言",
    dictionarySwapLanguagesLabel: "切换",
    favoritesEmptyState: {
      title: "",
      description: "",
      actionLabel: "",
      removeLabel: "",
    },
    searchEmptyState: { title: "", description: "" },
    chatInputPlaceholder: "",
    activeSidebarView: "dictionary",
  })),
}));

jest.unstable_mockModule("../hooks/useBottomPanelState.ts", async () => {
  const ReactModule = await import("react");
  const useBottomPanelStateMock = jest.fn(() => {
    const [mode, setMode] = ReactModule.useState("actions");

    return {
      mode,
      activateSearchMode: () => setMode("search"),
      activateActionsMode: () => setMode("actions"),
      handleFocusChange: jest.fn(),
      handleScrollEscape: jest.fn(),
    };
  });

  return {
    __esModule: true,
    PANEL_MODE_SEARCH: "search",
    default: useBottomPanelStateMock,
  };
});

jest.unstable_mockModule("@/components/Layout", () => ({
  __esModule: true,
  default: ({ bottomContent, children }) => (
    <div>
      <div data-testid="layout-bottom-content">{bottomContent}</div>
      <div>{children}</div>
    </div>
  ),
}));

jest.unstable_mockModule("@/pages/App/FavoritesView.jsx", () => ({
  __esModule: true,
  default: () => null,
}));

jest.unstable_mockModule("@/components/ui/HistoryDisplay", () => ({
  __esModule: true,
  default: () => null,
}));

jest.unstable_mockModule("@/components/ui/DictionaryEntry", () => ({
  __esModule: true,
  DictionaryEntryView: () => <div data-testid="dictionary-entry" />,
}));

jest.unstable_mockModule("@/components/ui/ChatInput", () => {
  const MockChatInput = ({ inputRef: forwardedRef }) => {
    const innerRef = useRef(null);

    useEffect(() => {
      if (innerRef.current) {
        forwardedRef.current = innerRef.current;
      }
      return () => {
        forwardedRef.current = null;
      };
    }, [forwardedRef]);

    return <input ref={innerRef} data-testid="dictionary-chat-input" />;
  };

  MockChatInput.displayName = "MockChatInput";

  return {
    __esModule: true,
    default: MockChatInput,
  };
});

jest.unstable_mockModule("@/components/ui/ICP", () => ({
  __esModule: true,
  default: () => null,
}));

jest.unstable_mockModule("@/components/ui/EmptyState", () => ({
  __esModule: true,
  default: () => null,
}));

jest.unstable_mockModule("@/components/ui/MessagePopup", () => ({
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
  default: ({ onRequestSearch, searchButtonLabel }) => (
    <button type="button" onClick={onRequestSearch}>
      {searchButtonLabel}
    </button>
  ),
}));

const DictionaryExperience = (await import("../DictionaryExperience.jsx")).default;

describe("DictionaryExperience focus management", () => {
  beforeEach(() => {
    focusInputMock.mockClear();
    inputRef.current = null;
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
    render(<DictionaryExperience />);

    const searchButton = screen.getByRole("button", { name: "返回搜索" });
    expect(focusInputMock).not.toHaveBeenCalled();

    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByTestId("dictionary-chat-input")).toBeInTheDocument();
      expect(focusInputMock).toHaveBeenCalledTimes(1);
    });
  });
});
