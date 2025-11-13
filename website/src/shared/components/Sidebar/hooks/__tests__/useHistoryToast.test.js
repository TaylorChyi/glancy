import { act, renderHook } from "@testing-library/react";

let useHistoryToast;

beforeAll(async () => {
  ({ default: useHistoryToast } = await import("../useHistoryToast.js"));
});

describe("useHistoryToast", () => {
  /**
   * 测试目标：错误信息应转化为可关闭的 toast 状态。
   */
  test("Given error message When hook evaluates Then exposes dismissible toast", () => {
    const { result, rerender } = renderHook(({ error }) => useHistoryToast(error), {
      initialProps: { error: "boom" },
    });

    expect(result.current.open).toBe(true);
    expect(result.current.message).toBe("boom");

    act(() => {
      result.current.onClose();
    });

    expect(result.current.open).toBe(false);
    expect(result.current.message).toBe("");

    rerender({ error: "second" });

    expect(result.current.message).toBe("second");
  });
});
