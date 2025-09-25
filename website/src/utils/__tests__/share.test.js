import { jest } from "@jest/globals";

import { attemptShareLink, resolveShareTarget } from "@/utils/share.js";

/**
 * 测试关注点：
 * 1. resolveShareTarget 会优先返回配置地址，并能识别相对路径。
 * 2. attemptShareLink 会优先调用 Web Share API，失败时自动回退到剪贴板。
 * 3. 对于用户取消和不支持的场景会给出正确的状态标识。
 */

describe("resolveShareTarget", () => {
  test("returns configured base url when provided", () => {
    const result = resolveShareTarget({
      baseUrl: "https://glancy.cn/share",
      currentUrl: "https://glancy.cn/dictionary",
    });

    expect(result).toBe("https://glancy.cn/share");
  });

  test("combines relative base with current url", () => {
    const result = resolveShareTarget({
      baseUrl: "/share",
      currentUrl: "https://glancy.cn/dictionary?term=test",
    });

    expect(result).toBe("https://glancy.cn/share");
  });

  test("falls back to current url when base is absent", () => {
    const result = resolveShareTarget({ currentUrl: "https://glancy.cn/live" });

    expect(result).toBe("https://glancy.cn/live");
  });
});

describe("attemptShareLink", () => {
  test("uses share api when available", async () => {
    const share = jest.fn(() => Promise.resolve());
    const navigatorMock = { share };

    const result = await attemptShareLink({
      title: "Share",
      text: "Hello",
      url: "https://glancy.cn",
      navigator: navigatorMock,
    });

    expect(share).toHaveBeenCalledWith({
      title: "Share",
      text: "Hello",
      url: "https://glancy.cn",
    });
    expect(result).toEqual({ status: "shared" });
  });

  test("returns aborted status when user cancels share", async () => {
    const share = jest.fn(() =>
      Promise.reject(
        Object.assign(new Error("cancel"), { name: "AbortError" }),
      ),
    );
    const navigatorMock = { share };

    const result = await attemptShareLink({
      text: "Hello",
      navigator: navigatorMock,
    });

    expect(result).toEqual({ status: "aborted" });
  });

  test("falls back to clipboard when share api unavailable", async () => {
    const writeText = jest.fn(() => Promise.resolve());
    const navigatorMock = { clipboard: { writeText } };

    const result = await attemptShareLink({
      url: "https://glancy.cn/share",
      navigator: navigatorMock,
    });

    expect(writeText).toHaveBeenCalledWith("https://glancy.cn/share");
    expect(result).toEqual({ status: "copied" });
  });

  test("returns failed when both share and clipboard unavailable", async () => {
    const result = await attemptShareLink({ text: "" });

    expect(result.status).toBe("failed");
  });
});
