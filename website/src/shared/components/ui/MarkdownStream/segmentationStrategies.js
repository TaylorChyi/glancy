/**
 * 背景：
 *  - 词典流式渲染此前默认启用按词拆分的 rehype 插件，但该行为会与最终 Markdown 渲染产生结构差异。
 * 目的：
 *  - 以策略模式封装不同的分段方案，允许在保持默认“无分段”输出的同时按需启用其他策略。
 * 关键决策与取舍：
 *  - 选择显式策略对象而非布尔开关，便于未来扩展（如按句/按段分段）并集中记录启用条件；
 *  - 当渲染器未声明支持分段能力时自动回退到空策略，保证兼容性。
 * 影响范围：
 *  - MarkdownStream 组件及其消费者，可通过 segmentation 属性切换策略。
 * 演进与TODO：
 *  - 后续可在 STRATEGIES 内追加更多策略，或暴露工厂函数支持运行时注册。
 */
import { STREAM_SEGMENTATION_PROP } from "./streamSegmentationProp.js";
import rehypeStreamWordSegments from "./rehypeStreamWordSegments.js";

function createStrategy({ id, resolvePlugins }) {
  return Object.freeze({
    id,
    resolvePlugins,
  });
}

const STRATEGIES = Object.freeze({
  none: createStrategy({
    id: "none",
    resolvePlugins: () => null,
  }),
  word: createStrategy({
    id: "word",
    resolvePlugins: ({ Renderer, defaultRenderer }) => {
      const supportsSegmentation =
        Renderer === defaultRenderer ||
        Renderer?.[STREAM_SEGMENTATION_PROP] === true;
      if (!supportsSegmentation) {
        return null;
      }
      return [rehypeStreamWordSegments];
    },
  }),
});

export function resolveSegmentationStrategy(name) {
  if (!name || typeof name !== "string") {
    return STRATEGIES.none;
  }
  return STRATEGIES[name] ?? STRATEGIES.none;
}

export const __INTERNAL__ = Object.freeze({ STRATEGIES });
