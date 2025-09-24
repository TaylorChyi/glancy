import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const loadHistory = jest.fn();

const historyMock = [
  {
    term: "alpha",
    language: "ENGLISH",
    termKey: "ENGLISH:alpha",
    createdAt: "2024-05-01T10:00:00Z",
    favorite: false,
    versions: [
      { id: "v1", createdAt: "2024-05-01T10:00:00Z", favorite: false },
    ],
    latestVersionId: "v1",
  },
];

jest.unstable_mockModule("@/context", () => ({
  useHistory: () => ({
    history: historyMock,
    loadHistory,
    error: null,
  }),
  useUser: () => ({ user: { token: "tkn" } }),
  useLanguage: () => ({
    t: { searchHistory: "历史" },
    lang: "zh",
  }),
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
}));

const { default: HistoryList } = await import("../HistoryList.jsx");

describe("HistoryList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 验证点击历史项时会返回词条名称。
   */
  test("calls onSelect with term only", async () => {
    const handleSelect = jest.fn();
    render(<HistoryList onSelect={handleSelect} />);

    await waitFor(() => {
      expect(loadHistory).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText("alpha"));
    expect(handleSelect).toHaveBeenCalledWith("alpha");
  });
});
