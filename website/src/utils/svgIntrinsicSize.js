/**
 * 背景：
 *  - 浏览器对缺少显式宽高的 SVG 资源不会暴露 naturalWidth/naturalHeight，
 *    导致头像裁剪等依赖固有尺寸的模块无法正确渲染。
 * 目的：
 *  - 提供纯函数解析器，从 SVG 文本中提取固有尺寸信息（优先 width/height，
 *    其次 viewBox），供上层在 naturalSize 缺失时安全回退。
 * 关键决策与取舍：
 *  - 采用 DOMParser 解析 XML，保持实现语义清晰且可测试；
 *  - 拒绝引入第三方图形库，避免体积膨胀并保留后续扩展空间。
 * 影响范围：
 *  - 头像裁剪、未来所有依赖 SVG 尺寸的功能可复用该工具函数；
 *    其余使用位图的流程不受影响。
 * 演进与TODO：
 *  - TODO: 后续若需支持带单位（cm/in 等）的尺寸，可在 parseNumericDimension 中扩展单位换算。
 */

/**
 * 意图：解析 width/height 属性中的数值部分，忽略像素后缀。
 * 输入：SVG 节点属性值字符串。
 * 输出：成功解析返回 number，失败返回 null。
 * 流程：
 *  1) 去除空白并匹配开头的数值；
 *  2) 将匹配结果转换为浮点数；
 * 错误处理：无法解析或数值非法时返回 null。
 * 复杂度：O(1)。
 */
function parseNumericDimension(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)/u);
  if (!match) {
    return null;
  }
  const numeric = Number.parseFloat(match[1]);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return numeric;
}

/**
 * 意图：从 SVG 文本中推导固有宽高。
 * 输入：完整的 SVG 文本内容。
 * 输出：若成功解析返回 { width, height }，否则返回 null。
 * 流程：
 *  1) 使用 DOMParser 解析 SVG；
 *  2) 先读取 width/height 属性的数值；
 *  3) 若缺失则尝试解析 viewBox 的宽高；
 * 错误处理：解析失败或不满足约束时返回 null。
 * 复杂度：O(n)，其中 n 为文本长度，解析由浏览器优化处理。
 */
export function extractSvgIntrinsicSize(svgContent) {
  if (typeof svgContent !== "string" || svgContent.trim() === "") {
    return null;
  }

  const parser = new DOMParser();
  const documentResult = parser.parseFromString(svgContent, "image/svg+xml");
  const svgElement = documentResult.documentElement;

  if (!svgElement || svgElement.tagName.toLowerCase() !== "svg") {
    return null;
  }

  const width = parseNumericDimension(svgElement.getAttribute("width"));
  const height = parseNumericDimension(svgElement.getAttribute("height"));

  if (width && height) {
    return { width, height };
  }

  const viewBox = svgElement.getAttribute("viewBox");
  if (typeof viewBox === "string" && viewBox.trim() !== "") {
    const tokens = viewBox
      .replaceAll(",", " ")
      .split(/\s+/u)
      .map((token) => token.trim())
      .filter(Boolean);
    if (tokens.length === 4) {
      const viewBoxWidth = Number.parseFloat(tokens[2]);
      const viewBoxHeight = Number.parseFloat(tokens[3]);
      if (
        Number.isFinite(viewBoxWidth) &&
        Number.isFinite(viewBoxHeight) &&
        viewBoxWidth > 0 &&
        viewBoxHeight > 0
      ) {
        return { width: viewBoxWidth, height: viewBoxHeight };
      }
    }
  }

  return null;
}

export default {
  extractSvgIntrinsicSize,
};
