/* eslint-env jest */
/**
 * 背景：
 *  - Layout 引入二层两区结构后需要新的快照以保证 DOM 层级稳定。
 * 目的：
 *  - 通过单测校验 #app/#sidebar/#main/#content/#docker 的存在与事件绑定。
 * 关键决策与取舍：
 *  - 采用模块级 mock 解耦 Sidebar/Icon 依赖，避免上下文耦合；
 *  - 借助 ResizeObserver mock 驱动 docker 高度同步，放弃真实测量以提升稳定性。
 * 影响范围：
 *  - Layout 组件结构、滚动回调、docker 占位逻辑。
 * 演进与TODO：
 *  - 后续可覆盖移动端模式与 sidebar 拖拽逻辑。
 */
import React, { forwardRef } from "react";
import { render, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";

class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {
    this.callback?.([{ contentRect: { height: 96 } }]);
  }

  unobserve() {}

  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

jest.unstable_mockModule("@/components/Sidebar", () => ({
  __esModule: true,
  default: forwardRef(function SidebarStub(
    { isMobile: _isMobile, open: _open, onClose: _onClose, ...rest },
    ref,
  ) {
    return (
      <aside
        {...rest}
        ref={ref}
        id="sidebar"
        data-testid="sidebar-stub"
        style={{ width: "320px" }}
      />
    );
  }),
}));

jest.unstable_mockModule("@/components/ui/Icon", () => ({
  __esModule: true,
  default: () => null,
}));

jest.unstable_mockModule("@/utils", () => ({
  __esModule: true,
  useIsMobile: () => false,
}));

const { default: Layout } = await import("@/components/Layout");

afterAll(() => {
  delete global.ResizeObserver;
});

describe("Layout", () => {
  /**
   * 测试目标：验证布局渲染出结构化分区并承载底部工具条。
   * 前置条件：提供 Sidebar/Icon/ResizeObserver 的最小 mock。
   * 步骤：
   *  1) 渲染 Layout 并传入子内容与 docker 内容。
   *  2) 查询结构性节点。
   * 断言：
   *  - 存在 #app、#sidebar、#main、#content、#docker。
   *  - docker 内包含传入的底部内容。
   * 边界/异常：
   *  - bottomContent 为空时 docker 仍会渲染空容器（由后续用例覆盖）。
   */
  test("renders required structural regions", () => {
    const { container } = render(
      <Layout bottomContent={<span data-testid="dock-item">tools</span>}>
        <div data-testid="content">Hello</div>
      </Layout>,
    );
    expect(container.querySelector("#app")).not.toBeNull();
    expect(container.querySelector("aside#sidebar")).not.toBeNull();
    expect(container.querySelector("main#main")).not.toBeNull();
    expect(container.querySelector("section#content")).not.toBeNull();
    const docker = container.querySelector("div#docker");
    expect(docker).not.toBeNull();
    expect(docker.querySelector("[data-testid='dock-item']")).not.toBeNull();
  });

  /**
   * 测试目标：验证滚动事件仅绑定在内容区并透传给回调。
   * 前置条件：提供可观察的 onMainMiddleScroll mock。
   * 步骤：
   *  1) 渲染 Layout 并传入 onMainMiddleScroll。
   *  2) 触发 content 的 scroll 事件。
   * 断言：
   *  - 回调收到滚动事件。
   * 边界/异常：
   *  - 未触发滚动时回调保持未调用状态。
   */
  test("invokes scroll handler on content scroll", () => {
    const handleScroll = jest.fn();
    const { container } = render(
      <Layout onMainMiddleScroll={handleScroll}>
        <div style={{ height: "200px" }} />
      </Layout>,
    );
    const content = container.querySelector("#content");
    expect(content).not.toBeNull();
    fireEvent.scroll(content, { target: { scrollTop: 40 } });
    expect(handleScroll).toHaveBeenCalledTimes(1);
  });

  /**
   * 测试目标：验证在缺失底部内容时 docker 仍维持结构占位。
   * 前置条件：无特殊前置，仅使用默认 mock。
   * 步骤：
   *  1) 渲染不传 bottomContent 的 Layout。
   *  2) 查询 docker 节点。
   * 断言：
   *  - docker 节点存在且 aria-label 正确。
   * 边界/异常：
   *  - 后续若引入可折叠 docker 需扩展此断言。
   */
  test("renders docker container without content", () => {
    const { container } = render(
      <Layout>
        <div />
      </Layout>,
    );
    const docker = container.querySelector("#docker");
    expect(docker).not.toBeNull();
    expect(docker.getAttribute("aria-label")).toBe("底部工具条");
    expect(docker?.textContent).toBe("");
  });
});
