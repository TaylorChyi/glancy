/**
 * 背景：
 *  - 现有图标存在明暗两套资源，且填充色被硬编码，无法配合主题动态变色。
 * 目的：
 *  - 借助 SVGO 在构建前移除 fill/stroke，统一改写为 `currentColor`，实现单源图标。
 * 关键决策与取舍：
 *  - 仅启用必要插件（removeDimensions/removeAttrs/addAttributes），避免过度优化导致路径丢失。
 * 影响范围：
 *  - icons:mono 工具输出的 SVG 文件。
 * 演进与TODO：
 *  - 后续可根据设计需要追加自定义插件，如压缩 path、保留 viewBox 等。
 */
const config = {
  plugins: [
    { name: "removeDimensions", active: true },
    { name: "removeAttrs", params: { attrs: "(fill|stroke)" } },
    {
      name: "addAttributesToSVGElement",
      params: { attributes: [{ fill: "currentColor" }] },
    },
  ],
};

export default config;
