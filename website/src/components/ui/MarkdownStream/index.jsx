import { useMemo } from "react";
import PropTypes from "prop-types";
import MarkdownRenderer from "../MarkdownRenderer";
import rehypeStreamWordSegments from "./rehypeStreamWordSegments.js";

/**
 * 渲染 Markdown 流内容的通用组件，默认使用 MarkdownRenderer。
 * 可通过 renderer 属性注入自定义渲染器以便测试或扩展。
 */
function MarkdownStream({ text, renderer }) {
  const Renderer = renderer || MarkdownRenderer;
  const additionalRehypePlugins = useMemo(
    () => (Renderer === MarkdownRenderer ? [rehypeStreamWordSegments] : null),
    [Renderer],
  );

  const rendererProps = additionalRehypePlugins
    ? { rehypePlugins: additionalRehypePlugins }
    : {};

  return (
    <Renderer className="stream-text" {...rendererProps}>
      {text}
    </Renderer>
  );
}

MarkdownStream.propTypes = {
  text: PropTypes.string,
  renderer: PropTypes.elementType,
};

export default MarkdownStream;
