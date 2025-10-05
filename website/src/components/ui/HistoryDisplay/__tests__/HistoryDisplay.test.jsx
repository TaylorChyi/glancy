import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";

const historyMock = [
  {
    term: "beta",
    displayTerm: "student",
    language: "ENGLISH",
    termKey: "ENGLISH:beta",
    createdAt: "2024-05-01T12:00:00Z",
    favorite: false,
    versions: [
      { id: "v10", createdAt: "2024-05-01T12:00:00Z", favorite: false },
    ],
    latestVersionId: "v10",
  },
];

jest.unstable_mockModule("@/context", () => ({
  useHistory: () => ({ history: historyMock }),
  useLanguage: () => ({
    t: {
      historyEmptyTitle: "暂无记录",
      historyEmptyDescription: "去搜索词汇吧",
      historyEmptyAction: "立即开始",
    },
    lang: "zh",
  }),
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
}));

const { default: HistoryDisplay } = await import("../HistoryDisplay.jsx");

describe("HistoryDisplay", () => {
  /**
   * 测试目标：验证点击历史卡片时返回完整记录与版本编号。
   * 前置条件：提供含 latestVersionId 的历史项并注入 onSelect。
   * 步骤：
   *  1) 渲染组件；
   *  2) 点击卡片按钮。
   * 断言：
   *  - onSelect 接收原始 historyItem 与 latestVersionId。
   */
  test("invokes onSelect with history item and version", () => {
    const handleSelect = jest.fn();
    render(<HistoryDisplay onSelect={handleSelect} />);

    const cardButton = screen.getByRole("button", { name: /student/ });
    fireEvent.click(cardButton);
    expect(handleSelect).toHaveBeenCalledWith(historyMock[0], "v10");
  });
});
