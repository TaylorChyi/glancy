import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const loadHistory = jest.fn();
const favoriteHistory = jest.fn();
const removeHistory = jest.fn();
const toggleFavorite = jest.fn();

const historyMock = [
  {
    term: "alpha",
    language: "ENGLISH",
    termKey: "ENGLISH:alpha",
    createdAt: "2024-05-01T10:00:00Z",
    favorite: false,
    versions: [
      { id: "v1", createdAt: "2024-05-01T10:00:00Z", favorite: false },
      { id: "v2", createdAt: "2024-04-01T10:00:00Z", favorite: false },
    ],
    latestVersionId: "v1",
  },
];

jest.unstable_mockModule("@/context", () => ({
  useHistory: () => ({
    history: historyMock,
    loadHistory,
    favoriteHistory,
    removeHistory,
    error: null,
  }),
  useFavorites: () => ({ toggleFavorite }),
  useUser: () => ({ user: { token: "tkn" } }),
  useLanguage: () => ({
    t: {
      favoriteAction: "收藏",
      deleteAction: "删除",
      expand: "展开版本",
      collapse: "收起版本",
      versionLabel: "版本",
    },
  }),
}));

const { default: HistoryList } = await import("../HistoryList.jsx");

describe("HistoryList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 验证点击历史项时默认选中最新版本，并在展开后可选择其他版本。
   */
  test("calls onSelect with latest version and expands versions", async () => {
    const handleSelect = jest.fn();
    render(<HistoryList onSelect={handleSelect} />);

    await waitFor(() => {
      expect(loadHistory).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText("alpha"));
    expect(handleSelect).toHaveBeenCalledWith("alpha", "v1");

    const expandButton = screen.getByText("展开版本");
    fireEvent.click(expandButton);

    const versionButton = await screen.findByText("版本 2");
    fireEvent.click(versionButton);
    expect(handleSelect).toHaveBeenLastCalledWith("alpha", "v2");
  });
});
