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
      { id: "v09", createdAt: "2024-04-28T08:00:00Z", favorite: false },
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
      versionLabel: "版本",
    },
  }),
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
}));

const { default: HistoryDisplay } = await import("../HistoryDisplay.jsx");

describe("HistoryDisplay", () => {
  /**
   * 验证列表初始就展示全部版本，并在点击时回调对应的版本 ID。
   */
  test("renders versions and invokes onSelect", () => {
    const handleSelect = jest.fn();
    render(<HistoryDisplay onSelect={handleSelect} />);

    const versionButton = screen.getByText("版本 2");
    fireEvent.click(versionButton);
    expect(handleSelect).toHaveBeenCalledWith("beta", "v09");
  });
});
