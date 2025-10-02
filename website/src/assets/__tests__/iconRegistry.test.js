/* eslint-env jest */
import { buildDynamicRegistry } from "@/assets/icons.js";

describe("buildDynamicRegistry", () => {
  /**
   * 验证基础用例：同名资源的不同主题后缀被聚合到统一的图标实体中，
   * 确保在浅色与深色主题间切换时能够命中既有素材。
   */
  test("aggregates theme variants into a single registry entry", () => {
    const registry = buildDynamicRegistry(
      {
        "./icons/eye-light.svg": "/assets/eye-light.svg",
        "./icons/eye-dark.svg": "/assets/eye-dark.svg",
        "./logos/wechat.svg": "/assets/wechat.svg",
      },
      {
        "./icons/eye-light.svg": "<svg>light</svg>",
        "./icons/eye-dark.svg": "<svg>dark</svg>",
        "./logos/wechat.svg": "<svg>wechat</svg>",
      },
    );

    expect(registry).toEqual({
      eye: {
        light: { src: "/assets/eye-light.svg", content: "<svg>light</svg>" },
        dark: { src: "/assets/eye-dark.svg", content: "<svg>dark</svg>" },
      },
      wechat: {
        single: { src: "/assets/wechat.svg", content: "<svg>wechat</svg>" },
      },
    });
  });

  /**
   * 验证跨平台场景：当打包环境使用 Windows 风格路径分隔符时，
   * 仍能提取出正确的图标名称并关联到原始 SVG 素材，避免回退占位符。
   */
  test("normalises windows style paths to keep original svg assets", () => {
    const registry = buildDynamicRegistry(
      {
        ".\\icons\\send-button-light.svg": "/assets/send-button-light.svg",
        ".\\icons\\send-button-dark.svg": "/assets/send-button-dark.svg",
      },
      {
        ".\\icons\\send-button-light.svg": "<svg>mask-light</svg>",
        ".\\icons\\send-button-dark.svg": "<svg>mask-dark</svg>",
      },
    );

    expect(registry).toEqual({
      "send-button": {
        light: {
          src: "/assets/send-button-light.svg",
          content: "<svg>mask-light</svg>",
        },
        dark: {
          src: "/assets/send-button-dark.svg",
          content: "<svg>mask-dark</svg>",
        },
      },
    });
  });
});
