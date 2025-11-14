import { jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsSectionsViewport from "@shared/components/settings/SettingsSectionsViewport";

const originalMatchMedia = window.matchMedia;

beforeAll(() => {
  window.matchMedia = (query) => ({
    media: query,
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  });
});

afterAll(() => {
  window.matchMedia = originalMatchMedia;
});

function TestSection({ headingId, descriptionId, title, testId }) {
  return (
    <section aria-labelledby={headingId} aria-describedby={descriptionId}>
      <h3 id={headingId} data-testid={`${testId}-heading`}>
        {title}
      </h3>
      {descriptionId ? (
        <p id={descriptionId} data-testid={`${testId}-description`}>
          {title} description
        </p>
      ) : null}
    </section>
  );
}

const BASE_SECTIONS = [
  {
    id: "general",
    label: "General",
    Component: TestSection,
    componentProps: { title: "General", testId: "general-probe" },
  },
  {
    id: "privacy",
    label: "Privacy",
    Component: TestSection,
    componentProps: { title: "Privacy", testId: "privacy-probe" },
  },
];

function buildBaseViewportProps() {
  const onSectionSelect = jest.fn();
  const onPanelElementChange = jest.fn();
  const onHeadingElementChange = jest.fn();
  const renderCloseAction = jest.fn(({ className }) => (
    <button
      type="button"
      data-testid="close-action"
      className={className}
      aria-label="Close"
    >
      ×
    </button>
  ));

  return {
    callbacks: {
      onSectionSelect,
      onPanelElementChange,
      onHeadingElementChange,
    },
    props: {
      sections: BASE_SECTIONS,
      activeSectionId: "general",
      onSectionSelect,
      tablistLabel: "Preference sections",
      renderCloseAction,
      referenceSectionId: "privacy",
      body: { className: "viewport-body" },
      nav: {
        classes: {
          container: "nav-container",
          action: "nav-action",
          nav: "nav-list",
          button: "nav-button",
          label: "nav-label",
          labelText: "nav-label-text",
          icon: "nav-icon",
          actionButton: "nav-close",
        },
      },
      panel: {
        panelId: "general-panel",
        tabId: "general-tab",
        headingId: "general-heading",
        className: "panel-base",
        surfaceClassName: "panel-surface",
        probeClassName: "panel-probe",
      },
      onHeadingElementChange,
      onPanelElementChange,
    },
  };
}

/**
 * 测试目标：组件应复用 SettingsNav/SettingsPanel，并维持测量探针与回调管道。
 * 前置条件：提供 sections、导航样式、panel 样式与回调函数。
 * 步骤：
 *  1) 渲染 SettingsSectionsViewport；
 *  2) 触发导航切换；
 *  3) 观察回调与测量探针渲染情况。
 * 断言：
 *  - onSectionSelect 收到被点击的 section；
 *  - onPanelElementChange 与 onHeadingElementChange 接收到 DOM 节点；
 *  - renderCloseAction 注入的按钮带有类名；
 *  - reference section 探针渲染并套用 probe class。
 * 边界/异常：
 *  - 若测量探针缺失或回调未触发视为失败。
 */
test("Given base props When rendering Then nav wiring and measurement remain intact", async () => {
  const { callbacks, props } = buildBaseViewportProps();
  const { onSectionSelect, onPanelElementChange, onHeadingElementChange } =
    callbacks;

  render(
    <SettingsSectionsViewport {...props}>
      <TestSection
        headingId="general-heading"
        descriptionId="general-description"
        title="General"
        testId="active"
      />
    </SettingsSectionsViewport>,
  );

  await waitFor(() =>
    expect(onPanelElementChange).toHaveBeenCalledWith(expect.any(HTMLElement)),
  );
  await waitFor(() =>
    expect(onHeadingElementChange).toHaveBeenCalledWith(
      expect.any(HTMLElement),
    ),
  );

  const closeButton = screen.getByTestId("close-action");
  expect(closeButton).toHaveClass("nav-close");

  const privacyTab = screen.getByRole("tab", { name: "Privacy" });
  await userEvent.click(privacyTab);
  expect(onSectionSelect).toHaveBeenCalledWith(
    expect.objectContaining({ id: "privacy" }),
  );

  const measurementProbe = screen.getByTestId("privacy-probe-heading");
  const probeWrapper = measurementProbe.closest("[aria-hidden='true']");
  expect(probeWrapper).toHaveClass("panel-base", "panel-probe");
});

/**
 * 测试目标：缺省 referenceSectionId 或 component 时应优雅回退，不渲染探针。
 * 前置条件：提供不含 Component 的分区，仅验证基础渲染。
 * 步骤：
 *  1) 渲染组件；
 *  2) 检查测量区域与 body 样式。
 * 断言：
 *  - 不存在 aria-hidden 的探针节点；
 *  - 自定义 body style 得到保留。
 * 边界/异常：
 *  - 若仍渲染探针或样式被覆盖则失败。
 */
test("Given missing reference component When rendering Then gracefully skip measurement", () => {
  render(
    <SettingsSectionsViewport
      sections={[
        { id: "account", label: "Account" },
        { id: "security", label: "Security" },
      ]}
      activeSectionId="account"
      onSectionSelect={jest.fn()}
      tablistLabel="Account sections"
      body={{
        className: "viewport-body",
        style: { backgroundColor: "rgb(1, 2, 3)" },
      }}
      nav={{ classes: { container: "nav-container" } }}
      panel={{
        panelId: "account-panel",
        tabId: "account-tab",
        headingId: "account-heading",
        className: "panel-base",
      }}
    >
      <div>Panel content</div>
    </SettingsSectionsViewport>,
  );

  expect(document.querySelector("[aria-hidden='true']")).toBeNull();
  expect(document.querySelector(".viewport-body")).toHaveStyle(
    "background-color: rgb(1, 2, 3)",
  );
});
