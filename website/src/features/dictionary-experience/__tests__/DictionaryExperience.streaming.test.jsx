import React from "react";
import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import { createDictionaryExperienceState } from "../../../../tests/setup/dictionary/experienceState.js";

const useDictionaryExperienceMock = jest.fn();
const dictionaryEntryViewSpy = jest.fn();
const activateSearchModeMock = jest.fn();
const activateActionsModeMock = jest.fn();
const handleFocusChangeMock = jest.fn();
const handleScrollEscapeMock = jest.fn();
const buildExperienceState = (overrides = {}) =>
  createDictionaryExperienceState({
    entry: null,
    ...overrides,
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

jest.unstable_mockModule("../components/panels/ActionPanel.jsx", () => ({
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

describe("DictionaryExperience preview rendering", () => {
  /**
   * 测试目标：当最终 Markdown 可用时，DictionaryEntryView 应展示该文本预览。
   * 前置条件：useDictionaryExperience 返回空 entry、finalText 不为空。
   */
  it("GivenFinalMarkdown_WhenEntryUnavailable_ShouldPropagatePreview", () => {
    const experienceState = buildExperienceState();
    experienceState.finalText = "## 最终排版";
    experienceState.loading = false;
    useDictionaryExperienceMock.mockReturnValue(experienceState);

    render(<DictionaryExperience />);

    expect(dictionaryEntryViewSpy).toHaveBeenCalledTimes(1);
    expect(dictionaryEntryViewSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        preview: "## 最终排版",
        isLoading: false,
      }),
    );
    expect(screen.getByTestId("dictionary-entry-view").dataset.preview).toBe(
      "## 最终排版",
    );
  });

  /**
   * 测试目标：在缺少词条且无任何预览内容时，应退回默认空状态视图。
   * 前置条件：useDictionaryExperience 返回 entry/finalText 皆为空，loading 为 false。
   */
  it("GivenIdleState_WhenNoPreview_ShouldRenderEmptyState", () => {
    const experienceState = buildExperienceState();
    useDictionaryExperienceMock.mockReturnValue(experienceState);

    render(<DictionaryExperience />);

    expect(dictionaryEntryViewSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("dictionary-empty-state")).toBeInTheDocument();
  });

  /**
   * 测试目标：加载状态下应通知 DictionaryEntryView 渲染占位内容。
   * 前置条件：useDictionaryExperience 返回 loading 为真、finalText 为空。
   */
  it("GivenLoadingState_WhenEntryMissing_ShouldFlagPlaceholder", () => {
    const experienceState = buildExperienceState();
    experienceState.loading = true;
    useDictionaryExperienceMock.mockReturnValue(experienceState);

    render(<DictionaryExperience />);

    expect(dictionaryEntryViewSpy).toHaveBeenCalledTimes(1);
    expect(dictionaryEntryViewSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entry: null,
        preview: "",
        isLoading: true,
      }),
    );
  });
});
