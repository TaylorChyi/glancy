import React from "react";
import { render, fireEvent, screen, within, act } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockTtsButton = jest.fn(() => <button data-testid="tts" type="button" />);

const userState = { user: { id: "u" } };

jest.unstable_mockModule("@/context", () => ({
  useLanguage: () => ({
    t: {
      reoutput: "重新输出",
      previousVersion: "上一版本",
      nextVersion: "下一版本",
      versionIndicator: "{current} / {total}",
      versionIndicatorEmpty: "0 / 0",
      versionMenuLabel: "选择版本",
      versionOptionLabel: "版本 {index}",
      copyAction: "复制",
      copySuccess: "复制完成",
      favoriteAction: "收藏",
      favoriteRemove: "取消收藏",
      deleteButton: "删除",
      share: "分享",
      report: "反馈",
      shareOptionLink: "复制分享链接",
      shareOptionImage: "导出长图",
      shareMenuLabel: "分享方式",
      shareImagePreparing: "生成图片",
      shareImageSuccess: "导出成功",
      shareImageFailed: "导出失败",
      dictionarySourceLanguageLabel: "源语言",
      dictionaryTargetLanguageLabel: "目标语言",
    },
    lang: "zh",
  }),
  useTheme: () => ({ resolvedTheme: "light" }),
  useUser: () => userState,
}));

jest.unstable_mockModule("@/components", () => ({
  TtsButton: mockTtsButton,
}));

const { default: OutputToolbar } = await import("@/components/OutputToolbar");

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
   * 验证版本下拉菜单在多版本场景下渲染，并正确透出选择事件。
   */
  test("renders version menu and delegates selection", () => {
    const onSelectVersion = jest.fn();
    render(
      <OutputToolbar
        term="hello"
        versions={[
          { id: "v1", createdAt: "2024-05-01T08:00:00Z" },
          { id: "v2", createdAt: "2024-05-02T09:00:00Z" },
        ]}
        activeVersionId="v1"
        onSelectVersion={onSelectVersion}
      />,
    );

    const trigger = screen.getByRole("button", { name: "选择版本" });
    expect(trigger).toHaveTextContent("版本 1");

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitemradio", { name: /版本 2/ }));

    expect(onSelectVersion).toHaveBeenCalledWith("v2");
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
  test("renders action buttons when permitted", async () => {
    const onToggleFavorite = jest.fn();
    const onDelete = jest.fn();
    const onCopyLink = jest.fn(() => Promise.resolve());
    const onExportImage = jest.fn(() => Promise.resolve());
    const onReport = jest.fn();
    const onCopy = jest.fn();

    render(
      <OutputToolbar
        term="hello"
        canCopy
        onCopy={onCopy}
        favorited
        onToggleFavorite={onToggleFavorite}
        canFavorite
        onDelete={onDelete}
        canDelete
        canShare
        shareModel={{
          canShare: true,
          onCopyLink,
          onExportImage,
          canExportImage: true,
        }}
        onReport={onReport}
        canReport
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "取消收藏" }));
    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    const shareTrigger = screen.getByRole("button", { name: "分享" });
    await act(async () => {
      fireEvent.click(shareTrigger);
    });
    await screen.findByRole("menu", { name: "分享方式" });
    const copyItem = await screen.findByRole("menuitem", {
      name: /复制分享链接/,
    });
    await act(async () => {
      fireEvent.click(copyItem);
    });
    await Promise.resolve();
    await act(async () => {
      fireEvent.click(shareTrigger);
    });
    const imageItem = await screen.findByRole("menuitem", { name: /导出长图/ });
    await act(async () => {
      fireEvent.click(imageItem);
    });
    await Promise.resolve();
    fireEvent.click(screen.getByRole("button", { name: "反馈" }));
    fireEvent.click(screen.getByRole("button", { name: "复制" }));

    expect(
      screen.getByRole("button", { name: "取消收藏" }).className,
    ).toContain("entry__tool-btn");
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onCopyLink).toHaveBeenCalledTimes(1);
    expect(onExportImage).toHaveBeenCalledTimes(1);
    expect(onReport).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
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
   * 测试目标：未登录用户亦可打开分享菜单以复制链接或导出长图。
   * 前置条件：userState.user 设为 null，组件获得包含复制回调的 shareModel。
   * 步骤：
   *  1) 渲染组件后点击分享按钮；
   *  2) 断言菜单同时提供复制与导出选项并触发复制操作；
   *  3) 再次开启菜单执行导出操作。
   * 断言：
   *  - 分享按钮保持可用并能弹出菜单；
   *  - 复制与导出均触发对应 shareModel 回调。
   * 边界/异常：
   *  - 若 shareModel 缺失或回调不是函数则应在其他用例中覆盖降级路径。
   */
  test("allowsShareMenuWithoutUser", async () => {
    userState.user = null;
    const onCopyLink = jest.fn(() => Promise.resolve());
    const onExportImage = jest.fn(() => Promise.resolve());
    render(
      <OutputToolbar
        term="hello"
        canShare
        shareModel={{
          canShare: true,
          onCopyLink,
          onExportImage,
          canExportImage: true,
        }}
      />,
    );

    const shareButton = screen.getByRole("button", { name: "分享" });
    expect(shareButton).not.toBeDisabled();
    await act(async () => {
      fireEvent.click(shareButton);
    });

    await screen.findByRole("menu", { name: "分享方式" });
    const copyItem = await screen.findByRole("menuitem", {
      name: /复制分享链接/,
    });
    const imageItem = await screen.findByRole("menuitem", {
      name: /导出长图/,
    });
    expect(imageItem).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(copyItem);
    });
    expect(onCopyLink).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(shareButton);
    });
    await screen.findByRole("menu", { name: "分享方式" });
    const imageItemSecond = await screen.findByRole("menuitem", {
      name: /导出长图/,
    });
    await act(async () => {
      fireEvent.click(imageItemSecond);
    });

    expect(onExportImage).toHaveBeenCalledTimes(1);
    userState.user = { id: "u" };
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
