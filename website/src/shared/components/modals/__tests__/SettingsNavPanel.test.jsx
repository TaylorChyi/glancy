/**
 * 背景：
 *  - SettingsNav 与 SettingsPanel 需要在无框架容器中验证焦点切换是否符合可访问性预期。
 * 目的：
 *  - 通过组合测试确保分区切换后标题获得焦点，并验证 Tab/Shift+Tab 焦点循环不会逃离模态。
 * 关键决策与取舍：
 *  - 选择真实组件 + 轻量测试容器而非模拟 Hook，确保行为贴近生产；放弃 e2e 以保持单测执行效率。
 * 影响范围：
 *  - 聚焦策略的回归验证，防止未来重构破坏键盘可达性。
 * 演进与TODO：
 *  - TODO: 后续可扩展至箭头键导航及滚动同步的断言。
 */
import { useCallback, useMemo, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsNav from "../SettingsNav.jsx";
import SettingsPanel from "../SettingsPanel.jsx";
import useSectionFocusManager from "@shared/hooks/useSectionFocusManager.js";

const originalMatchMedia = window.matchMedia;
const mediaQueryListeners = new Set();
let compactViewportMatches = false;

const notifyMediaQueryListeners = () => {
  for (const listener of mediaQueryListeners) {
    listener({ matches: compactViewportMatches });
  }
};

const setCompactViewport = (matches) => {
  compactViewportMatches = matches;
  notifyMediaQueryListeners();
};

beforeAll(() => {
  window.matchMedia = (query) => ({
    media: query,
    get matches() {
      return compactViewportMatches;
    },
    addEventListener: (event, listener) => {
      if (event === "change") {
        mediaQueryListeners.add(listener);
      }
    },
    removeEventListener: (event, listener) => {
      if (event === "change") {
        mediaQueryListeners.delete(listener);
      }
    },
    addListener: (listener) => {
      mediaQueryListeners.add(listener);
    },
    removeListener: (listener) => {
      mediaQueryListeners.delete(listener);
    },
    dispatchEvent: (event) => {
      if (event?.type === "change") {
        const payload = {
          matches:
            typeof event.matches === "boolean"
              ? event.matches
              : compactViewportMatches,
        };
        for (const listener of mediaQueryListeners) {
          listener(payload);
        }
      }
      return true;
    },
  });
});

afterAll(() => {
  window.matchMedia = originalMatchMedia;
});

beforeEach(() => {
  setCompactViewport(false);
});

function TestSection({ headingId, title, actionLabel }) {
  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} tabIndex={-1}>
        {title}
      </h3>
      <button type="button">{actionLabel}</button>
    </section>
  );
}

const DEFAULT_TEST_SECTIONS = Object.freeze([
  { id: "account", label: "Account" },
  { id: "privacy", label: "Privacy" },
]);

function TestSettingsHarness({
  withCloseAction = false,
  sections: overrideSections,
}) {
  const sections = useMemo(
    () => overrideSections ?? DEFAULT_TEST_SECTIONS,
    [overrideSections],
  );
  const [activeSectionId, setActiveSectionId] = useState(sections[0].id);
  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0];
  const headingId = `${activeSection.id}-heading`;

  const { captureFocusOrigin, registerHeading } = useSectionFocusManager({
    activeSectionId,
    headingId,
  });

  const handleSectionSelect = useCallback(
    (section) => {
      captureFocusOrigin();
      setActiveSectionId(section.id);
    },
    [captureFocusOrigin],
  );

  const closeRenderer = useMemo(() => {
    if (!withCloseAction) {
      return undefined;
    }
    return ({ className = "" } = {}) => (
      <button
        type="button"
        aria-label="Close preferences"
        className={className}
      >
        <span aria-hidden="true">×</span>
      </button>
    );
  }, [withCloseAction]);

  return (
    <div role="dialog" aria-modal="true">
      <SettingsNav
        sections={sections}
        activeSectionId={activeSectionId}
        onSelect={handleSectionSelect}
        tablistLabel="Example sections"
        renderCloseAction={closeRenderer}
      />
      <SettingsPanel
        panelId={`${activeSection.id}-panel`}
        tabId={`${activeSection.id}-tab`}
        headingId={headingId}
        onHeadingElementChange={registerHeading}
      >
        <TestSection
          headingId={headingId}
          title={`${activeSection.label} heading`}
          actionLabel={`${activeSection.label} action`}
        />
      </SettingsPanel>
    </div>
  );
}

/**
 * 测试目标：标签可访问名称仅包含主标签文本，不暴露冗余摘要。
 * 前置条件：渲染 TestSettingsHarness 并聚焦 account 标签。
 * 步骤：
 *  1) 查询 account 标签元素。
 *  2) 检查文案与摘要是否存在。
 * 断言：
 *  - 标签可访问名称为 Account。
 *  - DOM 内不存在 Account summary 文本节点。
 * 边界/异常：
 *  - 若未来重新引入摘要，应更新设计并同步调整断言。
 */
test("Given navigation sections When rendering Then only primary label is exposed", () => {
  render(<TestSettingsHarness />);

  const accountTab = screen.getByRole("tab", { name: "Account" });
  expect(accountTab).toHaveAccessibleName("Account");
  expect(screen.queryByText("Account summary")).not.toBeInTheDocument();
});

/**
 * 测试目标：在渲染导航时暴露分区数量 CSS 变量供响应式样式消费。
 * 前置条件：渲染默认的 TestSettingsHarness，提供两个分区。
 * 步骤：
 *  1) 查询 role 为 tablist 的导航元素。
 *  2) 读取行内 style 中的 --settings-nav-section-count。
 * 断言：
 *  - CSS 自定义属性等于字符串 "2"，指示当前分区数量。
 * 边界/异常：
 *  - 若未来通过容器注入外部 style，需同步更新此断言以匹配最新接口。
 */
test("Given navigation sections When rendering Then exposes section count variable", () => {
  render(<TestSettingsHarness />);

  const tablist = screen.getByRole("tablist", { name: "Example sections" });
  expect(tablist.style.getPropertyValue("--settings-nav-section-count")).toBe(
    "2",
  );
});

/**
 * 测试目标：切换分区后标题获得焦点并滚动至首部。
 * 前置条件：渲染 TestSettingsHarness，激活默认 account 分区。
 * 步骤：
 *  1) 点击 Privacy 分区标签。
 *  2) 等待焦点迁移。
 * 断言：
 *  - document.activeElement 与 Privacy 标题相同，失败信息提示当前聚焦元素。
 * 边界/异常：
 *  - 若 requestAnimationFrame 不可用，利用 setTimeout 回退仍应通过。
 */
test("Given section change When selecting new tab Then heading receives focus", async () => {
  const user = userEvent.setup();
  render(<TestSettingsHarness />);

  await user.click(screen.getByRole("tab", { name: /^Privacy/ }));

  const privacyHeading = await screen.findByRole("heading", {
    name: "Privacy heading",
  });

  await waitFor(() => {
    expect(document.activeElement).toBe(privacyHeading);
  });
});

/**
 * 测试目标：验证 Tab/Shift+Tab 在模态内循环且不逃逸。
 * 前置条件：渲染 TestSettingsHarness，并切换至 Privacy 分区以触发焦点逻辑。
 * 步骤：
 *  1) 点击 Privacy 分区标签等待标题聚焦。
 *  2) 依次执行 Tab、Shift+Tab。
 * 断言：
 *  - Tab 后焦点落在分区按钮。
 *  - Shift+Tab 回到 Privacy 标签按钮，焦点仍位于模态内。
 * 边界/异常：
 *  - 若有额外聚焦元素插入，应更新断言顺序保持循环闭合。
 */
test("Given heading focus When tabbing Then focus remains within modal", async () => {
  const user = userEvent.setup();
  render(<TestSettingsHarness />);

  const privacyTab = screen.getByRole("tab", { name: /^Privacy/ });
  await user.click(privacyTab);

  const privacyHeading = await screen.findByRole("heading", {
    name: "Privacy heading",
  });

  await waitFor(() => {
    expect(document.activeElement).toBe(privacyHeading);
  });

  await user.tab();
  const privacyActionButton = await screen.findByRole("button", {
    name: "Privacy action",
  });
  expect(document.activeElement).toBe(privacyActionButton);

  await user.tab({ shift: true });
  expect(document.activeElement).toBe(privacyTab);
});

/**
 * 测试目标：验证插入的关闭动作位于导航首位且可通过键盘聚焦。
 * 前置条件：渲染 TestSettingsHarness 并启用 withCloseAction，使关闭按钮挂载在导航中。
 * 步骤：
 *  1) 执行一次 Tab 聚焦最先的交互元素。
 *  2) 再次 Tab 聚焦后续的标签按钮。
 * 断言：
 *  - 第一次 Tab 后焦点位于关闭按钮。
 *  - 第二次 Tab 后焦点切换到 Account 标签，保持线性键盘顺序。
 * 边界/异常：
 *  - 若未来在关闭按钮前新增可聚焦节点，此断言会失败提醒更新顺序。
 */
test("Given close action When tabbing forward Then focus visits close control before tabs", async () => {
  const user = userEvent.setup();
  render(<TestSettingsHarness withCloseAction />);

  const closeButton = screen.getByRole("button", { name: "Close preferences" });
  await user.tab();
  expect(closeButton).toHaveFocus();

  const accountTab = screen.getByRole("tab", { name: /^Account/ });
  await user.tab();
  expect(accountTab).toHaveFocus();
});

const SECTIONS_WITH_ICONS = Object.freeze([
  { id: "account", label: "Account", icon: { name: "user" } },
  { id: "privacy", label: "Privacy" },
]);

/**
 * 测试目标：验证导航图标渲染为装饰元素且不影响标签可访问名称。
 * 前置条件：渲染带 icon 配置的 TestSettingsHarness，默认激活 account 分区。
 * 步骤：
 *  1) 查询 Account 标签按钮。
 *  2) 检查图标包装元素的可访问属性。
 * 断言：
 *  - 存在 data-section-icon="user" 的节点。
 *  - 图标包装节点具备 aria-hidden="true"，保证读屏器忽略。
 * 边界/异常：
 *  - 若未来允许非装饰性图标，应根据 alt 逻辑调整断言。
 */
test("Given section icon When rendering Then exposes decorative icon wrapper", () => {
  render(<TestSettingsHarness sections={SECTIONS_WITH_ICONS} />);

  const accountTab = screen.getByRole("tab", { name: "Account" });
  const iconWrapper = accountTab.querySelector('[data-section-icon="user"]');
  expect(iconWrapper).not.toBeNull();
  expect(iconWrapper).toHaveAttribute("aria-hidden", "true");
});

/**
 * 测试目标：窄屏模式下导航切换为水平布局并隐藏文本，仅保留图标展示。
 * 前置条件：设置 matchMedia 返回 matches=true，渲染带图标的分区。
 * 步骤：
 *  1) 渲染 TestSettingsHarness。
 *  2) 查询 tablist 与标签文本节点。
 * 断言：
 *  - tablist 的 aria-orientation 为 horizontal。
 *  - 标签按钮具备 aria-label 并保留可访问名称。
 *  - 标签文本节点设置 aria-hidden="true" 以配合视觉隐藏。
 * 边界/异常：
 *  - 若未来部分分区缺少图标，应回退展示文本并更新断言。
 */
test("Given compact viewport When rendering Then switches to horizontal icon-only navigation", () => {
  setCompactViewport(true);
  render(<TestSettingsHarness sections={SECTIONS_WITH_ICONS} />);

  const tablist = screen.getByRole("tablist", { name: "Example sections" });
  expect(tablist).toHaveAttribute("aria-orientation", "horizontal");

  const accountTab = screen.getByRole("tab", { name: "Account" });
  expect(accountTab).toHaveAttribute("aria-label", "Account");

  const labelTextNode = accountTab.querySelector('[data-element="label-text"]');
  expect(labelTextNode).not.toBeNull();
  expect(labelTextNode).toHaveAttribute("aria-hidden", "true");
});
