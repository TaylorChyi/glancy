/* eslint-env jest */
import { buildDynamicRegistry } from "@assets/icons.js";

describe("buildDynamicRegistry", () => {
  /**
   * 验证跨平台场景：当打包环境使用 Windows 风格路径分隔符时，
   * 仍能提取出正确的图标名称并关联到单一 SVG 素材，避免回退占位符。
   */
  test("normalises windows style paths to keep original svg assets", () => {
    const registry = buildDynamicRegistry(
      {
        ".\\chat-send.svg": "/assets/chat-send.svg",
      },
      {
        ".\\chat-send.svg": '<svg data-token="chat-send"></svg>',
      },
    );

    expect(registry).toEqual({
      "chat-send": {
        single: Object.freeze({
          url: "/assets/chat-send.svg",
          inline: '<svg data-token="chat-send"></svg>',
        }),
      },
    });
  });
});
