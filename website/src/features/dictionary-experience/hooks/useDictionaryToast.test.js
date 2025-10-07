import { act, renderHook } from "@testing-library/react";
import { useDictionaryToast } from "./useDictionaryToast.js";

describe("useDictionaryToast", () => {
  /**
   * 测试目标：调用 showToast 应打开提示并应用自定义配置。
   * 前置条件：使用默认配置初始化 Hook。
   * 步骤：
   *  1) 执行 showToast 传入消息与覆写参数；
   *  2) 读取当前 state。
   * 断言：
   *  - open 为 true；
   *  - 消息与自定义属性被写入。
   * 边界/异常：
   *  - duration 需回退到默认值时由其他用例覆盖。
   */
  it("opens toast with provided overrides", () => {
    const { result } = renderHook(() =>
      useDictionaryToast({ defaultDuration: 5000 }),
    );

    act(() => {
      result.current.showToast("已完成", {
        duration: 1200,
        backgroundColor: "#111111",
        textColor: "#fefefe",
        closeLabel: "关闭提示",
      });
    });

    expect(result.current.state).toMatchObject({
      open: true,
      message: "已完成",
      duration: 1200,
      backgroundColor: "#111111",
      textColor: "#fefefe",
      closeLabel: "关闭提示",
    });
  });

  /**
   * 测试目标：调用 closeToast 应仅关闭提示不清空配置。
   * 前置条件：先打开一次 Toast。
   * 步骤：
   *  1) showToast 写入消息；
   *  2) closeToast 关闭提示。
   * 断言：
   *  - open 变为 false；
   *  - 其他字段保持最近一次的值。
   * 边界/异常：
   *  - 若后续需要重置字段，可在 Hook 内新增重置逻辑。
   */
  it("closes toast while retaining last payload", () => {
    const { result } = renderHook(() => useDictionaryToast());

    act(() => {
      result.current.showToast("Saved");
    });

    act(() => {
      result.current.closeToast();
    });

    expect(result.current.state).toMatchObject({
      open: false,
      message: "Saved",
    });
  });
});
