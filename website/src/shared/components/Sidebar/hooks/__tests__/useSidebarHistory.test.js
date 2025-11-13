import { renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockUseHistoryLoading = jest.fn();
const mockUseHistoryNavigation = jest.fn();
const mockUseHistoryToast = jest.fn();

jest.unstable_mockModule("../useHistoryLoading.js", () => ({
  __esModule: true,
  default: mockUseHistoryLoading,
}));

jest.unstable_mockModule("../useHistoryNavigation.js", () => ({
  __esModule: true,
  default: mockUseHistoryNavigation,
}));

jest.unstable_mockModule("../useHistoryToast.js", () => ({
  __esModule: true,
  default: mockUseHistoryToast,
}));

let useSidebarHistory;

beforeAll(async () => {
  ({ default: useSidebarHistory } = await import("../useSidebarHistory.js"));
});

describe("useSidebarHistory", () => {
  beforeEach(() => {
    mockUseHistoryLoading.mockReset();
    mockUseHistoryNavigation.mockReset();
    mockUseHistoryToast.mockReset();
  });

  /**
   * 测试目标：组合钩子应汇聚子钩子返回的视图属性。
   */
  test("Given modular hooks When composing Then exposes aggregated history props", () => {
    const navigationBindings = jest.fn();
    const loadMore = jest.fn();
    const onSelect = jest.fn();

    mockUseHistoryLoading.mockReturnValue({
      items: [1, 2, 3],
      onSelect,
      loadMore,
      hasMore: true,
      isLoading: false,
      error: "boom",
    });
    mockUseHistoryNavigation.mockReturnValue(navigationBindings);
    mockUseHistoryToast.mockReturnValue({ open: true, message: "boom", onClose: jest.fn() });

    const { result } = renderHook(() =>
      useSidebarHistory({ onSelectHistory: jest.fn() }),
    );

    expect(mockUseHistoryLoading).toHaveBeenCalledWith({
      onSelectHistory: expect.any(Function),
    });
    expect(mockUseHistoryNavigation).toHaveBeenCalledWith([1, 2, 3]);
    expect(mockUseHistoryToast).toHaveBeenCalledWith("boom");

    expect(result.current).toMatchObject({
      items: [1, 2, 3],
      onSelect,
      onNavigate: navigationBindings,
      toast: { open: true, message: "boom" },
      hasMore: true,
      isLoading: false,
      loadMore,
    });
  });
});
