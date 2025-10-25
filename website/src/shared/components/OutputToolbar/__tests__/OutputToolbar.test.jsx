import React from "react";
import { render, fireEvent, screen, within } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockTtsButton = jest.fn(() => <button data-testid="tts" type="button" />);

const userState = { user: { id: "u" } };

jest.unstable_mockModule("@core/context", () => ({
  useLanguage: () => ({
    t: {
      reoutput: "重新输出",
      previousVersion: "上一版本",
      nextVersion: "下一版本",
      versionIndicator: "{current} / {total}",
      versionIndicatorEmpty: "0 / 0",
      copyAction: "复制",
      copySuccess: "复制完成",
      deleteButton: "删除",
      report: "反馈",
      dictionarySourceLanguageLabel: "源语言",
      dictionaryTargetLanguageLabel: "目标语言",
    },
    lang: "zh",
  }),
  useTheme: () => ({ resolvedTheme: "light" }),
  useUser: () => userState,
}));

jest.unstable_mockModule("@shared/components", () => ({
  TtsButton: mockTtsButton,
}));

const { default: OutputToolbar } = await import("@shared/components/OutputToolbar");

describe("OutputToolbar", () => {
  beforeEach(() => {
    mockTtsButton.mockClear();
    userState.user = { id: "u" };
  });

  /**
   * 验证语音按钮仅在 term 存在时渲染，并保留 reoutput 功能。
   */
  test("renders tts when term provided and handles reoutput", () => {
    const onReoutput = jest.fn();
    render(
      <OutputToolbar
        term="hello"
        lang="en"
        onReoutput={onReoutput}
        versions={[{ id: "v1" }]}
      />,
    );

    const toolbar = screen.getByRole("toolbar", { name: "词条工具栏" });
    expect(toolbar.className).toContain("entry__toolbar");
    expect(mockTtsButton).toHaveBeenCalledTimes(1);
    expect(mockTtsButton.mock.calls[0][0]).toEqual(
      expect.objectContaining({ text: "hello", lang: "en" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "重新输出" }));
    expect(onReoutput).toHaveBeenCalledTimes(1);
  });

  /**
   * 验证无 term 时不会渲染语音按钮且导航禁用。
   */
  test("hides tts without term and disables navigation", () => {
    render(<OutputToolbar term="" versions={[]} />);

    expect(mockTtsButton).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "上一版本" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "下一版本" })).toBeDisabled();
    expect(screen.getByText("0 / 0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制" })).toBeDisabled();
  });

  /**
   * 验证版本指示器展示正确且导航回调带方向。
   */
  test("shows indicator and emits navigation intent", () => {
    const onNavigate = jest.fn();
    render(
      <OutputToolbar
        term="hello"
        versions={[{ id: "a" }, { id: "b" }, { id: "c" }]}
        activeVersionId="b"
        onNavigate={onNavigate}
      />,
    );

    const pagerGroup = screen.getByRole("group", { name: "例句翻页" });
    expect(pagerGroup.className).toContain("entry__pager");
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "下一版本" }));
    expect(onNavigate).toHaveBeenCalledWith("next");
    fireEvent.click(screen.getByRole("button", { name: "上一版本" }));
    expect(onNavigate).toHaveBeenCalledWith("previous");
  });

  /**
   * 测试目标：多版本场景仅展示翻页按钮与指示器，不渲染下拉菜单。
   * 前置条件：传入三个版本并指定当前激活版本。
   * 步骤：
   *  1) 渲染 OutputToolbar；
   *  2) 获取版本拨盘容；
   *  3) 统计按钮数量并尝试查找下拉触发器。
   * 断言：
   *  - 拨盘中仅存在两个导航按钮；
   *  - 查找“选择版本”按钮返回 null。
   * 边界/异常：
   *  - 若未来重新引入版本菜单，需要更新此测试验证新的交互。
   */
  test("WhenMultipleVersionsPresent_MenuRemainsHidden", () => {
    render(
      <OutputToolbar
        term="hello"
        versions={[{ id: "v1" }, { id: "v2" }, { id: "v3" }]}
        activeVersionId="v2"
      />,
    );

    const pagerGroup = screen.getByRole("group", { name: "例句翻页" });
    const buttons = within(pagerGroup).getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(within(pagerGroup).queryByRole("button", { name: "选择版本" })).toBeNull();
  });

  /**
   * 验证注入自定义 TTS 组件时不会调用默认组件。
   */
  test("prefers injected tts component", () => {
    const customTts = jest.fn(() => <div data-testid="custom-tts" />);
    render(
      <OutputToolbar
        term="hello"
        versions={[{ id: "v1" }]}
        ttsComponent={customTts}
      />,
    );

    expect(customTts).toHaveBeenCalled();
    expect(mockTtsButton).not.toHaveBeenCalled();
  });

  /**
   * 确认启用动作按钮时在工具栏中渲染并响应交互。
   */
  test("renders action buttons when permitted", () => {
    const onDelete = jest.fn();
    const onReport = jest.fn();
    const onCopy = jest.fn();

    render(
      <OutputToolbar
        term="hello"
        canCopy
        onCopy={onCopy}
        onDelete={onDelete}
        canDelete
        onReport={onReport}
        canReport
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    fireEvent.click(screen.getByRole("button", { name: "反馈" }));
    fireEvent.click(screen.getByRole("button", { name: "复制" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onReport).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "分享" })).toBeNull();
  });

  /**
   * 测试目标：复制成功态下按钮需禁用并显示勾选图标，恢复 idle 后重新启用。
   * 前置条件：组件接收 copyFeedbackState="success" 与 isCopySuccess=true。
   * 步骤：
   *  1) 初次渲染为成功态，断言禁用与图标；
   *  2) rerender 为 idle，断言图标/禁用恢复。
   * 断言：
   *  - 勾选态按钮禁用且渲染 copy-success 图标；
   *  - idle 态恢复复制图标与可用状态。
   * 边界/异常：
   *  - 若状态切换未更新按钮属性，将导致断言失败。
   */
  test("GivenCopySuccessState_WhenRendering_ThenShowsSuccessIconAndDisables", () => {
    const { rerender } = render(
      <OutputToolbar
        term="gamma"
        canCopy
        onCopy={jest.fn()}
        copyFeedbackState="success"
        isCopySuccess
      />,
    );

    const successButton = screen.getByRole("button", { name: "复制完成" });
    expect(successButton).toBeDisabled();
    expect(
      within(successButton).getByRole("img", { name: "copy-success" }),
    ).toBeInTheDocument();

    rerender(
      <OutputToolbar
        term="gamma"
        canCopy
        onCopy={jest.fn()}
        copyFeedbackState="idle"
        isCopySuccess={false}
      />,
    );

    const idleButton = screen.getByRole("button", { name: "复制" });
    expect(idleButton).not.toBeDisabled();
    expect(
      within(idleButton).getByRole("img", { name: "copy" }),
    ).toBeInTheDocument();
  });

  /**
   * 验证 renderRoot 策略可替换默认容器，且仍保留 aria 语义。
   */
  test("supports custom root renderer", () => {
    const renderRoot = jest.fn(
      ({ children, className, role, ariaLabel, dataTestId }) => (
        <section
          data-testid="custom-toolbar"
          data-original-testid={dataTestId}
          data-role={role}
          aria-label={ariaLabel}
          className={`host ${className}`}
        >
          {children}
        </section>
      ),
    );

    render(
      <OutputToolbar
        term="hello"
        versions={[{ id: "only" }]}
        renderRoot={renderRoot}
      />,
    );

    expect(renderRoot).toHaveBeenCalled();
    const host = screen.getByTestId("custom-toolbar");
    expect(host.dataset.role).toBe("toolbar");
    expect(host.getAttribute("aria-label")).toBe("词条工具栏");
    expect(host.className).toContain("entry__toolbar");
  });
});
