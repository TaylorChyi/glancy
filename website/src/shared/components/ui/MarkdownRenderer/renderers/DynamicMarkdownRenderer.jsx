/**
 * 背景：
 *  - 动态渲染曾直接与断行注入、折叠节点耦合，阻塞可测试性与拆分。
 * 目的：
 *  - 以组合方式拼装 ReactMarkdown 所需的插件与组件映射，
 *    确保调用方可继续通过 props 扩展 Markdown 行为。
 * 关键决策与取舍：
 *  - 采用“生成器 + 组合”模式，将折叠组件与断行策略封装在 buildMarkdownComponents 内；
 *  - remark/rehype 插件链保持向后兼容，允许调用方按需追加；
 *  - 在无子节点时提前返回 null，避免 ReactMarkdown 内部额外渲染。
 * 影响范围：
 *  - 仅对 MarkdownRenderer 的动态分支生效。
 * 演进与TODO：
 *  - 后续若需要根据内容类型动态调整插件，可在此处添加策略分派。
 */
import { useMemo } from "react";
import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import rehypeCollapsibleSections from "../rehypeCollapsibleSections.js";
import useBreakableContent from "../hooks/useBreakableContent.js";
import buildMarkdownComponents from "./buildMarkdownComponents.js";

export default function DynamicMarkdownRenderer({
  children,
  remarkPlugins: additionalRemarkPlugins,
  rehypePlugins: additionalRehypePlugins,
  components: additionalComponents,
  ...props
}) {
  const injectBreaks = useBreakableContent();
  const baseComponents = useMemo(
    () =>
      buildMarkdownComponents({
        injectBreaks,
      }),
    [injectBreaks],
  );
  const components = useMemo(
    () => ({
      ...baseComponents,
      ...(additionalComponents ?? {}),
    }),
    [additionalComponents, baseComponents],
  );

  const remarkPlugins = useMemo(
    () => [remarkGfm, ...(additionalRemarkPlugins ?? [])],
    [additionalRemarkPlugins],
  );
  const rehypePlugins = useMemo(
    () => [rehypeCollapsibleSections, ...(additionalRehypePlugins ?? [])],
    [additionalRehypePlugins],
  );

  if (!children) {
    return null;
  }

  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={components}
      {...props}
    >
      {children}
    </ReactMarkdown>
  );
}

DynamicMarkdownRenderer.propTypes = {
  children: PropTypes.node,
  remarkPlugins: PropTypes.arrayOf(PropTypes.func),
  rehypePlugins: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.func, PropTypes.array]),
  ),
  components: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  ),
};
