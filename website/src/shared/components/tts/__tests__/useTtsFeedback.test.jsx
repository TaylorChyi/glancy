/* eslint-env jest */
import { renderHook, act, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const navigate = jest.fn();

jest.unstable_mockModule("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

const { default: useTtsFeedback } = await import(
  "@shared/components/tts/useTtsFeedback.js"
);

describe("useTtsFeedback", () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  /**
   * 测试目标：403 错误触发弹窗提示。
   * 前置条件：初始无错误，随后注入 code=403 的错误对象。
   * 步骤：
   *  1) 渲染 Hook 并 rerender 提供错误。
   * 断言：
   *  - isPopupOpen 为 true 且 message 匹配错误文案。
   * 边界/异常：
   *  - 若错误无 message，应退化为空字符串（另有默认覆盖）。
   */
  test("GivenForbiddenError_WhenHandlingFeedback_ThenPopupOpens", async () => {
    const { result, rerender } = renderHook(
      ({ error }) => useTtsFeedback(error),
      {
        initialProps: { error: null },
      },
    );

    act(() => {
      rerender({ error: { code: 403, message: "Pro only" } });
    });

    await waitFor(() => {
      expect(result.current.isPopupOpen).toBe(true);
      expect(result.current.popupMessage).toBe("Pro only");
    });
  });

  /**
   * 测试目标：429 错误触发 toast 提示。
   * 前置条件：初始无错误，随后注入 code=429 的错误对象。
   * 步骤：
   *  1) 渲染 Hook 并注入错误。
   * 断言：
   *  - isToastOpen 为 true 且 message 正确。
   * 边界/异常：
   *  - 该路径不应影响 popup 与 upgrade 状态。
   */
  test("GivenRateLimitError_WhenHandlingFeedback_ThenToastOpens", async () => {
    const { result, rerender } = renderHook(
      ({ error }) => useTtsFeedback(error),
      {
        initialProps: { error: null },
      },
    );

    act(() => {
      rerender({ error: { code: 429, message: "Too many" } });
    });

    await waitFor(() => {
      expect(result.current.isToastOpen).toBe(true);
      expect(result.current.toastMessage).toBe("Too many");
      expect(result.current.isPopupOpen).toBe(false);
    });
  });

  /**
   * 测试目标：401 错误触发登录重定向。
   * 前置条件：初始无错误，随后注入 code=401 的错误对象。
   * 步骤：
   *  1) 渲染 Hook 并注入错误。
   * 断言：
   *  - navigate 被调用且参数为默认登录路径。
   * 边界/异常：
   *  - 若未来允许自定义路径，应更新断言。
   */
  test("GivenUnauthorizedError_WhenHandlingFeedback_ThenNavigatesToLogin", async () => {
    const { rerender } = renderHook(({ error }) => useTtsFeedback(error), {
      initialProps: { error: null },
    });

    act(() => {
      rerender({ error: { code: 401, message: "Login" } });
    });

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/login");
    });
  });

  /**
   * 测试目标：openUpgrade 会打开模态并清理弹窗信息。
   * 前置条件：先注入 403 错误以展示弹窗。
   * 步骤：
   *  1) rerender 注入错误；2) 调用 openUpgrade。
   * 断言：
   *  - isUpgradeOpen 为 true；popup 被清空。
   * 边界/异常：
   *  - closeUpgrade 后应可再次打开（属于后续扩展测试）。
   */
  test("GivenUpgradeRequest_WhenInvoked_ThenClosesPopupAndOpensModal", async () => {
    const { result, rerender } = renderHook(
      ({ error }) => useTtsFeedback(error),
      {
        initialProps: { error: null },
      },
    );

    act(() => {
      rerender({ error: { code: 403, message: "Pro only" } });
    });

    await waitFor(() => {
      expect(result.current.isPopupOpen).toBe(true);
    });

    act(() => {
      result.current.openUpgrade();
    });

    expect(result.current.isUpgradeOpen).toBe(true);
    expect(result.current.isPopupOpen).toBe(false);
  });
});
