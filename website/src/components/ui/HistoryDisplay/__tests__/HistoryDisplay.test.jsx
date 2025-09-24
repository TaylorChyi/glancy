import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";

const historyMock = [
  {
    term: "beta",
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
   * 验证点击卡片时只返回词条名称。
   */
  test("invokes onSelect with term only", () => {
    const handleSelect = jest.fn();
    render(<HistoryDisplay onSelect={handleSelect} />);

    const cardButton = screen.getByRole("button", { name: /beta/ });
    fireEvent.click(cardButton);
    expect(handleSelect).toHaveBeenCalledWith("beta");
  });
});
