import { act, renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";

let useHistoryNavigation;

beforeAll(async () => {
  ({ default: useHistoryNavigation } = await import("../useHistoryNavigation.js"));
});

describe("useHistoryNavigation", () => {
  /**
   * 测试目标：向下键应聚焦下一个已注册元素。
   */
  test("Given registered items When ArrowDown pressed Then focuses next entry", () => {
    const items = [{ id: "1" }, { id: "2" }];
    const { result } = renderHook(() => useHistoryNavigation(items));

    const firstBindings = result.current(0);
    const secondBindings = result.current(1);

    const firstButton = document.createElement("button");
    const secondButton = document.createElement("button");
    secondButton.focus = jest.fn();

    firstBindings.ref(firstButton);
    secondBindings.ref(secondButton);

    act(() => {
      firstBindings.onKeyDown({ key: "ArrowDown", preventDefault: jest.fn() });
    });

    expect(secondButton.focus).toHaveBeenCalledTimes(1);
  });
});
