import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";

const historyMock = [
  {
    term: "βeta",
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

jest.unstable_mockModule("@core/context", () => ({
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
   * 验证点击卡片时会返回完整历史项与版本信息，并展示已归一化的 term。
   */
  test("renders normalized term and forwards selection payload", () => {
    const handleSelect = jest.fn();
    render(<HistoryDisplay onSelect={handleSelect} />);

    const cardButton = screen.getByRole("button", { name: /βeta/ });
    fireEvent.click(cardButton);
    expect(handleSelect).toHaveBeenCalledWith(historyMock[0], "v10");
  });
});
