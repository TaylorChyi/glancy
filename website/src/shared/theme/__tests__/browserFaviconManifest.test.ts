const baseGlancyWebSvg = "<svg><rect fill='currentColor'/></svg>";
import {
  buildBrowserFaviconManifest,
  createBrowserFaviconRegistry,
  ensureBrowserFaviconManifest,
  getBrowserFaviconBaseSvgGlobalKey,
  getBrowserFaviconManifestGlobalKey,
  setBrowserFaviconBaseSvg,
} from "@shared/theme/browserFaviconManifest";

/**
 * 测试目标：使用默认调色板构建 manifest 时应生成黑白两款数据 URI。
 * 前置条件：提供原始 glancy-web.svg 文本。
 * 步骤：
 *  1) 调用 buildBrowserFaviconManifest；
 *  2) 校验浅色与深色条目。
 * 断言：
 *  - light/default 包含 %23000000；
 *  - dark 包含 %23ffffff；
 * 边界/异常：
 *  - 验证返回结构包含所需键值。
 */
test("Given_default_palette_When_building_manifest_Then_generate_black_and_white_icons", () => {
  const manifest = buildBrowserFaviconManifest(baseGlancyWebSvg);
  expect(manifest.light).toContain("%23000000");
  expect(manifest.default).toBe(manifest.light);
  expect(manifest.dark).toContain("%23ffffff");
});

/**
 * 测试目标：ensureBrowserFaviconManifest 应复用全局缓存并供注册表解析。
 * 前置条件：准备隔离的全局对象。
 * 步骤：
 *  1) 首次调用 ensureBrowserFaviconManifest；
 *  2) 再次调用验证缓存；
 *  3) 使用 createBrowserFaviconRegistry 解析浏览器配色。
 * 断言：
 *  - 两次返回同一引用；
 *  - 全局对象挂载 manifest；
 *  - 注册表可解析 dark/light。
 * 边界/异常：
 *  - 覆盖无浏览器环境时的降级全局。
 */
test("Given_isolated_global_When_ensuring_manifest_Then_cache_and_resolve_through_registry", () => {
  const mockGlobal: Record<string, unknown> = {};
  setBrowserFaviconBaseSvg(mockGlobal, baseGlancyWebSvg);
  const manifestA = ensureBrowserFaviconManifest(mockGlobal);
  const manifestB = ensureBrowserFaviconManifest(mockGlobal);
  expect(manifestA).toBe(manifestB);

  const manifestKey = getBrowserFaviconManifestGlobalKey();
  expect(mockGlobal[manifestKey]).toBe(manifestA);

  const baseKey = getBrowserFaviconBaseSvgGlobalKey();
  expect(mockGlobal[baseKey]).toBe(baseGlancyWebSvg);

  const registry = createBrowserFaviconRegistry(mockGlobal);
  expect(registry.resolve("dark")).toBe(manifestA.dark);
  expect(registry.resolve("light")).toBe(manifestA.light);
});
