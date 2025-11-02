import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";

let LanguageLauncher;

beforeAll(async () => {
  ({ default: LanguageLauncher } = await import("../parts/LanguageLauncher.jsx"));
});

/**
 * 测试目标：点击三点按钮时应打开菜单并触发默认语向的 onMenuOpen。
 * 前置条件：源/目标语均可用且提供 onMenuOpen 回调。
 * 步骤：
 *  1) 渲染组件并点击触发按钮。
 *  2) 读取菜单行与回调次数。
 * 断言：
 *  - onMenuOpen 以 "source" 作为首个入参；
 *  - 菜单内出现源语菜单项以及对应选项。
 * 边界/异常：
 *  - 若 onMenuOpen 未触发说明默认语向状态异常。
 */
test("GivenLauncher_WhenOpening_ThenEmitSourceMenuOpen", async () => {
  const user = userEvent.setup();
  const handleSourceChange = jest.fn();
  const handleMenuOpen = jest.fn();

  render(
    <LanguageLauncher
      sourceLanguage="ZH"
      sourceLanguageOptions={[
        { value: "ZH", label: "中文" },
        { value: "EN", label: "英文" },
      ]}
      sourceLanguageLabel="源语言"
      onSourceLanguageChange={handleSourceChange}
      targetLanguage="EN"
      targetLanguageOptions={[
        { value: "EN", label: "英文" },
      ]}
      targetLanguageLabel="目标语言"
      onTargetLanguageChange={jest.fn()}
      normalizeSourceLanguage={(value) => value}
      normalizeTargetLanguage={(value) => value}
      onMenuOpen={handleMenuOpen}
    />,
  );

  const trigger = screen.getByRole("button", { name: "源语言 → 目标语言" });
  await user.click(trigger);

  expect(handleMenuOpen).toHaveBeenCalledWith("source");
  expect(
    await screen.findByRole("menuitem", { name: /源语言/ }),
  ).toBeInTheDocument();
  expect(await screen.findAllByRole("menuitemradio")).toHaveLength(2);
});

/**
 * 测试目标：悬停目标语行应切换选项面板并回调 onMenuOpen("target")。
 * 前置条件：已打开菜单。
 * 步骤：
 *  1) 打开菜单；
 *  2) 悬停目标语菜单行；
 *  3) 观察回调与右侧选项文本。
 * 断言：
 *  - onMenuOpen 至少一次以 "target" 作为入参；
 *  - 面板展示目标语选项文本。
 * 边界/异常：
 *  - 若面板未切换则说明 activeVariant 状态异常。
 */
test("GivenLauncher_WhenHoveringTargetRow_ThenSwitchVariant", async () => {
  const user = userEvent.setup();
  const handleMenuOpen = jest.fn();

  render(
    <LanguageLauncher
      sourceLanguage="ZH"
      sourceLanguageOptions={[
        { value: "ZH", label: "中文" },
      ]}
      sourceLanguageLabel="源语言"
      onSourceLanguageChange={jest.fn()}
      targetLanguage="EN"
      targetLanguageOptions={[
        { value: "EN", label: "英文" },
        { value: "FR", label: "法语" },
      ]}
      targetLanguageLabel="目标语言"
      onTargetLanguageChange={jest.fn()}
      normalizeSourceLanguage={(value) => value}
      normalizeTargetLanguage={(value) => value}
      onMenuOpen={handleMenuOpen}
    />,
  );

  const trigger = screen.getByRole("button", { name: "源语言 → 目标语言" });
  await user.click(trigger);

  const targetRow = await screen.findByRole("menuitem", { name: /目标语言/ });
  await user.hover(targetRow);
  targetRow.focus();

  expect(handleMenuOpen).toHaveBeenCalledWith("target");
  expect(await screen.findByRole("menuitemradio", { name: /法语/ })).toBeInTheDocument();
});

/**
 * 测试目标：选择新语言后应回调 onSourceLanguageChange 并关闭菜单。
 * 前置条件：菜单已打开且包含多语言选项。
 * 步骤：
 *  1) 打开菜单；
 *  2) 点击新的源语言选项；
 *  3) 观察回调参数与按钮 data-open。
 * 断言：
 *  - 回调接收到归一化后的值；
 *  - 按钮 data-open 清空表示菜单关闭。
 * 边界/异常：
 *  - 若菜单未关闭可能导致二次点击异常。
 */
test("GivenLauncher_WhenSelectingOption_ThenInvokeChangeAndClose", async () => {
  const user = userEvent.setup();
  const handleSourceChange = jest.fn();

  render(
    <LanguageLauncher
      sourceLanguage="ZH"
      sourceLanguageOptions={[
        { value: "ZH", label: "中文" },
        { value: "EN", label: "英文" },
      ]}
      sourceLanguageLabel="源语言"
      onSourceLanguageChange={handleSourceChange}
      targetLanguage="EN"
      targetLanguageOptions={[]}
      targetLanguageLabel="目标语言"
      onTargetLanguageChange={jest.fn()}
      normalizeSourceLanguage={(value) => value}
      normalizeTargetLanguage={(value) => value}
    />,
  );

  const trigger = screen.getByRole("button", { name: "源语言 → 目标语言" });
  await user.click(trigger);

  const englishOption = await screen.findByRole("menuitemradio", { name: /英文/ });
  await user.click(englishOption);

  expect(handleSourceChange).toHaveBeenCalledWith("EN");
  await waitFor(() => {
    expect(trigger.getAttribute("data-open")).toBeNull();
  });
});
