import { renderHook, act } from "@testing-library/react";

const { useMessagePopup } = await import("../useMessagePopup.js");

describe("useMessagePopup", () => {
  /**
   * 测试目标：当传入消息时应打开弹窗并写入对应文案。
   * 前置条件：初始化 Hook，弹窗默认关闭。
   * 步骤：调用 showPopup("hello")。
   * 断言：popupOpen 为 true，popupMsg 为 "hello"。
   * 边界/异常：消息为空字符串时将在其他用例覆盖。
   */
  it("opens popup with provided message", () => {
    const { result } = renderHook(() => useMessagePopup());

    act(() => {
      result.current.showPopup("hello");
    });

    expect(result.current.popupOpen).toBe(true);
    expect(result.current.popupMsg).toBe("hello");
  });

  /**
   * 测试目标：关闭弹窗仅影响打开状态，不改写当前消息。
   * 前置条件：先调用 showPopup 打开弹窗。
   * 步骤：依次调用 showPopup("hello")、closePopup()。
   * 断言：popupOpen 为 false，popupMsg 仍为 "hello"。
   * 边界/异常：保证关闭操作不会抹掉文案以支持动画复用。
   */
  it("closes popup without clearing message", () => {
    const { result } = renderHook(() => useMessagePopup());

    act(() => {
      result.current.showPopup("hello");
    });

    act(() => {
      result.current.closePopup();
    });

    expect(result.current.popupOpen).toBe(false);
    expect(result.current.popupMsg).toBe("hello");
  });

  /**
   * 测试目标：传入空消息或 resetPopup 能彻底重置状态。
   * 前置条件：弹窗已展示上一条消息。
   * 步骤：调用 showPopup("hello")，随后 showPopup("")，最后 resetPopup()。
   * 断言：每一步后 popupOpen 关闭且 popupMsg 为空字符串。
   * 边界/异常：覆盖历史逻辑中以空字符串关闭弹窗的用法。
   */
  it("resets popup when message becomes empty", () => {
    const { result } = renderHook(() => useMessagePopup());

    act(() => {
      result.current.showPopup("hello");
    });

    act(() => {
      result.current.showPopup("");
    });

    expect(result.current.popupOpen).toBe(false);
    expect(result.current.popupMsg).toBe("");

    act(() => {
      result.current.showPopup("hi");
    });

    act(() => {
      result.current.resetPopup();
    });

    expect(result.current.popupOpen).toBe(false);
    expect(result.current.popupMsg).toBe("");
  });
});
