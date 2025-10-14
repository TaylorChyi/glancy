/**
 * 背景：
 *  - Markdown 流渲染组件需要一个稳定的标识来启用按词切分的增强能力。
 * 目的：
 *  - 该模块集中维护启用流式分词的约定属性名，供渲染器之间共享。
 * 关键决策与取舍：
 *  - 采用常量并独立文件，避免在 React 组件文件中混杂非组件导出，从而维持 Fast Refresh 一致性；
 *  - 放弃直接硬编码在组件内，降低后续扩展或重命名时的耦合风险。
 * 影响范围：
 *  - MarkdownStream 及其自定义渲染器之间的接口约束。
 * 演进与TODO：
 *  - 如未来需要更多流渲染协议，可在此文件扩展相关常量或导出配置对象。
 */

export const STREAM_SEGMENTATION_PROP = "enableStreamWordSegmentation";
