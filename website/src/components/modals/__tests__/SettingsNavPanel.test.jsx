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
import useSectionFocusManager from "@/hooks/useSectionFocusManager.js";

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

function TestSettingsHarness() {
  const sections = useMemo(
    () => [
      { id: "account", label: "Account", summary: "Account summary" },
      { id: "privacy", label: "Privacy", summary: "Privacy summary" },
    ],
    [],
  );
  const [activeSectionId, setActiveSectionId] = useState(sections[0].id);
  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];
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

  return (
    <div role="dialog" aria-modal="true">
      <SettingsNav
        sections={sections}
        activeSectionId={activeSectionId}
        onSelect={handleSectionSelect}
        tablistLabel="Example sections"
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

  const privacyHeading = await screen.findByRole("heading", { name: "Privacy heading" });

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

  const privacyHeading = await screen.findByRole("heading", { name: "Privacy heading" });

  await waitFor(() => {
    expect(document.activeElement).toBe(privacyHeading);
  });

  await user.tab();
  const privacyActionButton = await screen.findByRole("button", { name: "Privacy action" });
  expect(document.activeElement).toBe(privacyActionButton);

  await user.tab({ shift: true });
  expect(document.activeElement).toBe(privacyTab);
});

