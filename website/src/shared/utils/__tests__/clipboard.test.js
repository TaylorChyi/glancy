import {
  describe,
  expect,
  test,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { copyTextToClipboard, __private__ } from "../clipboard.js";

/**
 * 测试逻辑:
 *  1. 当传入空字符串时直接返回 empty 状态。
 *  2. 在支持 writeText 的情况下应调用剪贴板并返回 copied。
 *  3. 若 writeText 抛错则返回 error 状态。
 */
describe("copyTextToClipboard", () => {
  test("returns empty when source is blank", async () => {
    const result = await copyTextToClipboard("   \n\t");
    expect(result.status).toBe("empty");
  });

  test("delegates to provided clipboard", async () => {
    const writeText = jest.fn().mockResolvedValue();
    const clipboard = { writeText };
    const result = await copyTextToClipboard("hello", { clipboard });
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(result.status).toBe("copied");
  });

  test("returns error when clipboard throws", async () => {
    const writeText = jest.fn().mockRejectedValue(new Error("boom"));
    const clipboard = { writeText };
    const result = await copyTextToClipboard("hello", { clipboard });
    expect(result.status).toBe("error");
  });
});

/**
 * 测试逻辑:
 *  1. 当 window.navigator 不存在时返回 undefined。
 *  2. 在浏览器环境下返回 navigator 对象。
 */
describe("getNavigatorRef", () => {
  let originalNavigator;

  beforeEach(() => {
    originalNavigator = global.navigator;
  });

  afterEach(() => {
    if (originalNavigator === undefined) {
      Reflect.deleteProperty(global, "navigator");
    } else {
      global.navigator = originalNavigator;
    }
  });

  test("returns undefined when navigator missing", () => {
    Reflect.deleteProperty(global, "navigator");
    expect(__private__.getNavigatorRef()).toBeUndefined();
  });

  test("returns navigator when available", () => {
    global.navigator = { clipboard: {} };
    expect(__private__.getNavigatorRef()).toBe(global.navigator);
  });
});
