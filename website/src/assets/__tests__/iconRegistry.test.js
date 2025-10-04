/* eslint-env jest */
import { buildDynamicRegistry } from "@/assets/icons.js";

describe("buildDynamicRegistry", () => {
  /**
   * 验证基础用例：带有主题后缀的资源应聚合为同一图标实体，
   * 即便所有 SVG 均位于 assets 根目录，也能正确推断明暗态。
   */
  test("aggregates theme variants into a single registry entry", () => {
    const registry = buildDynamicRegistry({
      "./eye-light.svg": "/assets/eye-light.svg",
      "./eye-dark.svg": "/assets/eye-dark.svg",
      "./wechat.svg": "/assets/wechat.svg",
    });

    expect(registry).toEqual({
      eye: { light: "/assets/eye-light.svg", dark: "/assets/eye-dark.svg" },
      wechat: { single: "/assets/wechat.svg" },
    });
  });

  /**
   * 验证跨平台场景：当打包环境使用 Windows 风格路径分隔符时，
   * 仍能提取出正确的图标名称并关联到原始 SVG 素材，避免回退占位符。
   */
  test("normalises windows style paths to keep original svg assets", () => {
    const registry = buildDynamicRegistry({
      ".\\send-button.svg": "/assets/send-button.svg",
    });

    expect(registry).toEqual({
      "send-button": {
        single: "/assets/send-button.svg",
      },
    });
  });
});
