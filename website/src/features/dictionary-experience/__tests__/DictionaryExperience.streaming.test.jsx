/**
 * 背景：
 *  - 词典体验需要在 LLM 流式响应未完成时预览 Markdown，避免用户等待空白界面。
 * 目的：
 *  - 验证 DictionaryExperience 在词条缺席阶段仍能向下游组件传递 streamText 以及最终 Markdown。
 * 关键决策与取舍：
 *  - 通过桩件固定 useDictionaryExperience 的输出，聚焦展示层组合逻辑；
 *  - 选择浅层组件测试而非 Hook 单测，确保视图层契约稳定。
 * 影响范围：
 *  - DictionaryExperience 到 DictionaryEntryView/EmptyState 的渲染分支。
 * 演进与TODO：
 *  - 后续可引入真实 Markdown 渲染快照，覆盖更多样式与语义组合。
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";

const useDictionaryExperienceMock = jest.fn();
const dictionaryEntryViewSpy = jest.fn();
const activateSearchModeMock = jest.fn();
const activateActionsModeMock = jest.fn();
const handleFocusChangeMock = jest.fn();
const handleScrollEscapeMock = jest.fn();

const createBaseExperienceState = () => ({
  inputRef: { current: null },
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
  handleShowDictionary: jest.fn(),
  handleShowLibrary: jest.fn(),
  handleSelectHistory: jest.fn(),
  activeView: "dictionary",
  viewState: {
    isDictionary: true,
    isHistory: false,
    isLibrary: false,
  },
  focusInput: jest.fn(),
  entry: null,
  finalText: "",
  streamText: "",
  loading: false,
  dictionaryActionBarProps: { onReoutput: jest.fn() },
  displayClassName: "dictionary-experience",
  popupOpen: false,
  popupMsg: "",
  closePopup: jest.fn(),
  toast: null,
  closeToast: jest.fn(),
  dictionaryTargetLanguageLabel: "目标语言",
  dictionarySourceLanguageLabel: "源语言",
  dictionarySwapLanguagesLabel: "切换",
  searchEmptyState: {
    title: "开始探索",
    description: "输入任何词汇即可获取解释",
  },
  chatInputPlaceholder: "输入查询内容",
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
});

jest.unstable_mockModule("../hooks/useDictionaryExperience.js", () => ({
  __esModule: true,
  useDictionaryExperience: useDictionaryExperienceMock,
}));

jest.unstable_mockModule("../hooks/useBottomPanelState", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    mode: "search",
    activateSearchMode: activateSearchModeMock,
    activateActionsMode: activateActionsModeMock,
    handleFocusChange: handleFocusChangeMock,
    handleScrollEscape: handleScrollEscapeMock,
  })),
  PANEL_MODE_SEARCH: "search",
}));

jest.unstable_mockModule("../components/BottomPanelSwitcher.jsx", () => ({
  __esModule: true,
  default: ({ mode, searchContent, actionsContent }) => (
    <div data-testid="bottom-panel" data-mode={mode}>
      {mode === "search" ? searchContent : actionsContent}
    </div>
  ),
}));

jest.unstable_mockModule("../components/DictionaryActionPanel.jsx", () => ({
  __esModule: true,
  default: ({ actionBarProps }) => (
    <div
      data-testid="dictionary-action-panel"
      data-has-action={Boolean(actionBarProps)}
    />
  ),
}));

jest.unstable_mockModule("@shared/components/ui/DictionaryEntry", () => ({
  __esModule: true,
  default: (props) => {
    dictionaryEntryViewSpy(props);
    return (
      <div data-testid="dictionary-entry" data-preview={props.preview || ""}>
        dictionary-entry
      </div>
    );
  },
  DictionaryEntryView: (props) => {
    dictionaryEntryViewSpy(props);
    return (
      <div
        data-testid="dictionary-entry-view"
        data-preview={props.preview || ""}
      >
        dictionary-entry-view
      </div>
    );
  },
}));

jest.unstable_mockModule("@shared/components/Layout", () => ({
  __esModule: true,
  default: ({ sidebarProps, bottomContent, children }) => (
    <div
      data-testid="layout-root"
      data-active-view={sidebarProps?.activeView || ""}
    >
      {bottomContent ? (
        <div data-testid="layout-bottom">{bottomContent}</div>
      ) : null}
      <div data-testid="layout-children">{children}</div>
    </div>
  ),
}));

jest.unstable_mockModule("@shared/components/ui/HistoryDisplay", () => ({
  __esModule: true,
  default: () => <div data-testid="history-display" />,
}));

jest.unstable_mockModule("@shared/components/ui/ChatInput", () => ({
  __esModule: true,
  default: (props) => (
    <form data-testid="dictionary-chat-input">
      <textarea
        data-testid="dictionary-chat-input-textarea"
        value={props.value}
        onChange={(event) => props.onChange?.(event)}
      />
    </form>
  ),
}));

jest.unstable_mockModule("@shared/components/ui/ICP", () => ({
  __esModule: true,
  default: () => <div data-testid="dictionary-icp" />,
  DockedICP: () => <div data-testid="dictionary-icp" />,
}));

jest.unstable_mockModule("@shared/components/ui/EmptyState", () => ({
  __esModule: true,
  default: ({ title, description }) => (
    <div data-testid="dictionary-empty-state">
      <span>{title}</span>
      <p>{description}</p>
    </div>
  ),
}));

jest.unstable_mockModule("@app/pages/App/LibraryLandingView.jsx", () => ({
  __esModule: true,
  default: ({ label }) => <div data-testid="library-landing">{label}</div>,
}));

jest.unstable_mockModule("@shared/components/ui/MessagePopup", () => ({
  __esModule: true,
  default: ({ open, message }) => (
    <div data-testid="message-popup" data-open={open ? "yes" : "no"}>
      {message}
    </div>
  ),
}));

const DictionaryExperienceModule = await import("../DictionaryExperience.jsx");
const DictionaryExperience = DictionaryExperienceModule.default;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("DictionaryExperience streaming preview", () => {
  /**
   * 测试目标：流式 Markdown 预览在词条未就绪时需透传至 DictionaryEntryView。
   * 前置条件：useDictionaryExperience 返回空 entry、存在 streamText 且 loading 状态为真。
   * 步骤：
   *  1) 提供包含 streamText 的桩数据并渲染 DictionaryExperience；
   *  2) 读取 DictionaryEntryView 接收到的 props。
   * 断言：
   *  - preview 属性等于 streamText；
   *  - isLoading 属性为 true，以驱动占位渲染。
   * 边界/异常：
   *  - 若 streamText 为空应回退至 EmptyState（另案覆盖）。
   */
  it("GivenStreamingPreview_WhenNoEntryYet_ShouldPropagatePreview", () => {
    const experienceState = createBaseExperienceState();
    experienceState.streamText = "## 流式释义";
    experienceState.loading = true;
    useDictionaryExperienceMock.mockReturnValue(experienceState);

    render(<DictionaryExperience />);

    expect(dictionaryEntryViewSpy).toHaveBeenCalledTimes(1);
    expect(dictionaryEntryViewSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entry: null,
        preview: "## 流式释义",
        isLoading: true,
      }),
    );
    expect(screen.getByTestId("dictionary-entry-view").dataset.preview).toBe(
      "## 流式释义",
    );
  });

  /**
   * 测试目标：当 finalText 可用时应优先覆盖流式预览，保证最终排版一致。
   * 前置条件：useDictionaryExperience 返回空 entry、finalText 与 streamText 同时存在。
   * 步骤：
   *  1) 提供包含 finalText 的桩数据并渲染组件；
   *  2) 检查 DictionaryEntryView 接收到的 preview。
   * 断言：
   *  - preview 属性为 finalText；
   *  - DictionaryEntryView 仍只渲染一次。
   * 边界/异常：
   *  - 若 finalText 为空则应退回 streamText（由前序用例验证）。
   */
  it("GivenFinalMarkdown_WhenEntryUnavailable_ShouldPreferFinalText", () => {
    const experienceState = createBaseExperienceState();
    experienceState.streamText = "## 临时流";
    experienceState.finalText = "## 最终排版";
    experienceState.loading = false;
    useDictionaryExperienceMock.mockReturnValue(experienceState);

    render(<DictionaryExperience />);

    expect(dictionaryEntryViewSpy).toHaveBeenCalledTimes(1);
    expect(dictionaryEntryViewSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        preview: "## 最终排版",
      }),
    );
    expect(screen.getByTestId("dictionary-entry-view").dataset.preview).toBe(
      "## 最终排版",
    );
  });

  /**
   * 测试目标：在缺少词条且无任何预览内容时，应退回默认空状态视图。
   * 前置条件：useDictionaryExperience 返回 entry/finalText/streamText 皆为空，loading 为 false。
   * 步骤：
   *  1) 渲染组件；
   *  2) 查询空状态节点并确认 DictionaryEntryView 未被调用。
   * 断言：
   *  - 应渲染 data-testid 为 dictionary-empty-state 的节点；
   *  - DictionaryEntryView 不会被触发。
   * 边界/异常：
   *  - 若 loading 为 true 将显示骨架占位（本用例不覆盖）。
   */
  it("GivenIdleState_WhenNoPreview_ShouldRenderEmptyState", () => {
    const experienceState = createBaseExperienceState();
    useDictionaryExperienceMock.mockReturnValue(experienceState);

    render(<DictionaryExperience />);

    expect(dictionaryEntryViewSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("dictionary-empty-state")).toBeInTheDocument();
  });
});
