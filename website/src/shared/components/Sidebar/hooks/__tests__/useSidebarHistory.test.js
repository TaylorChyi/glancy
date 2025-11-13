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

const createLoadingState = (overrides = {}) => ({
  items: overrides.items ?? [1, 2, 3],
  onSelect: overrides.onSelect ?? jest.fn(),
  loadMore: overrides.loadMore ?? jest.fn(),
  hasMore: overrides.hasMore ?? true,
  isLoading: overrides.isLoading ?? false,
  error: overrides.error ?? "boom",
});

const createToastState = (overrides = {}) => ({
  open: overrides.open ?? true,
  message: overrides.message ?? "boom",
  onClose: overrides.onClose ?? jest.fn(),
});

const expectLoadMoreBinding = (hookResult, expectedLoadMore) => {
  expect(hookResult.current.loadMore).toBe(expectedLoadMore);
};

const renderSidebarHistory = ({
  loading = {},
  navigation,
  toast = {},
  hookProps = { onSelectHistory: jest.fn() },
} = {}) => {
  const loadingState = createLoadingState(loading);
  mockUseHistoryLoading.mockReturnValue(loadingState);

  const navigationBindings = navigation ?? jest.fn();
  mockUseHistoryNavigation.mockReturnValue(navigationBindings);

  const toastState = createToastState(toast);
  mockUseHistoryToast.mockReturnValue(toastState);

  const renderResult = renderHook(() => useSidebarHistory(hookProps));

  return { renderResult, loadingState, navigationBindings, toastState };
};

beforeAll(async () => {
  ({ default: useSidebarHistory } = await import("../useSidebarHistory.js"));
});

describe("useSidebarHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("composition", () => {
    test("Given modular hooks When composing Then exposes aggregated history props", () => {
      const navigationBindings = jest.fn();

      const { renderResult, loadingState, toastState } = renderSidebarHistory({
        navigation: navigationBindings,
      });

      expect(mockUseHistoryLoading).toHaveBeenCalledWith({
        onSelectHistory: expect.any(Function),
      });
      expect(mockUseHistoryNavigation).toHaveBeenCalledWith(loadingState.items);
      expect(mockUseHistoryToast).toHaveBeenCalledWith(loadingState.error);

      expect(renderResult.result.current).toMatchObject({
        items: loadingState.items,
        onSelect: loadingState.onSelect,
        onNavigate: navigationBindings,
        toast: expect.objectContaining({
          open: toastState.open,
          message: toastState.message,
        }),
        hasMore: loadingState.hasMore,
        isLoading: loadingState.isLoading,
      });
    });
  });

  describe("pagination", () => {
    test("Given loadMore handler When reading hook Then reuses loading delegate", () => {
      const loadMore = jest.fn();

      const { renderResult, loadingState } = renderSidebarHistory({
        loading: { loadMore },
      });

      expectLoadMoreBinding(renderResult.result, loadMore);
      expect(renderResult.result.current.hasMore).toBe(loadingState.hasMore);
      expect(renderResult.result.current.isLoading).toBe(loadingState.isLoading);
    });
  });
});
