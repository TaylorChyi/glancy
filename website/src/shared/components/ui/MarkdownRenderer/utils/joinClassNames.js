/**
 * 背景：
 *  - 多个渲染分支需要组合外部传入与本地样式 className，历史实现分散复制。
 * 目的：
 *  - 提供可复用的 className 组合工具，过滤空值并保持顺序稳定。
 * 关键决策与取舍：
 *  - 维持简单实现即可满足当前需求，后续若引入 classnames 等库再考虑替换。
 * 影响范围：
 *  - MarkdownRenderer 的 plain 分支及未来可能的渲染器。
 */
export default function joinClassNames(...tokens) {
  return tokens.filter(Boolean).join(" ");
}
