import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const loadHistory = jest.fn();

const historyMock = [
  {
    term: "alpha",
    language: "ENGLISH",
    flavor: "BILINGUAL",
    termKey: "ENGLISH:BILINGUAL:alpha",
    createdAt: "2024-05-01T10:00:00Z",
    favorite: false,
    versions: [
      { id: "v1", createdAt: "2024-05-01T10:00:00Z", favorite: false },
    ],
    latestVersionId: "v1",
  },
  {
    term: "beta",
    language: "ENGLISH",
    flavor: "BILINGUAL",
    termKey: "ENGLISH:BILINGUAL:beta",
    createdAt: "2024-05-02T11:00:00Z",
    favorite: false,
    versions: [
      { id: "v2", createdAt: "2024-05-02T11:00:00Z", favorite: false },
    ],
    latestVersionId: "v2",
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
   * 验证点击历史项时会返回完整历史对象并附带版本信息。
   */
  test("calls onSelect with history payload", async () => {
    const handleSelect = jest.fn();
    render(<HistoryList onSelect={handleSelect} />);

    await waitFor(() => {
      expect(loadHistory).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText("alpha"));
    expect(handleSelect).toHaveBeenCalledWith(historyMock[0], "v1");
  });

  /**
   * 验证键盘方向键可以在历史记录项之间移动焦点。
   */
  test("arrow navigation moves focus across history items", async () => {
    render(<HistoryList onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(loadHistory).toHaveBeenCalled();
    });

    const firstItem = await screen.findByRole("button", { name: "alpha" });
    const secondItem = await screen.findByRole("button", { name: "beta" });

    firstItem.focus();
    expect(document.activeElement).toBe(firstItem);

    fireEvent.keyDown(firstItem, { key: "ArrowDown" });
    expect(document.activeElement).toBe(secondItem);

    fireEvent.keyDown(secondItem, { key: "ArrowUp" });
    expect(document.activeElement).toBe(firstItem);
  });
});
