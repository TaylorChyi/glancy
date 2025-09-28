import { renderHook, act } from "@testing-library/react";

const { useDictionaryPopup } = await import("./useDictionaryPopup.js");

describe("useDictionaryPopup", () => {
  /**
   * 测试路径：展示弹窗。
   * 步骤：调用 showPopup。
   * 断言：应写入消息并标记弹窗为开启。
   */
  it("opens popup with provided message", () => {
    const { result } = renderHook(() => useDictionaryPopup());

    act(() => {
      result.current.showPopup("Hello");
    });

    expect(result.current.popupOpen).toBe(true);
    expect(result.current.popupMsg).toBe("Hello");
  });

  /**
   * 测试路径：关闭弹窗。
   * 步骤：先调用 showPopup 再执行 closePopup。
   * 断言：弹窗标记应变为关闭。
   */
  it("closes popup when closePopup is called", () => {
    const { result } = renderHook(() => useDictionaryPopup());

    act(() => {
      result.current.showPopup("Hello");
    });

    act(() => {
      result.current.closePopup();
    });

    expect(result.current.popupOpen).toBe(false);
  });
});
