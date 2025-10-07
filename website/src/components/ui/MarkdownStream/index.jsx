import { useMemo } from "react";
import PropTypes from "prop-types";
import MarkdownRenderer from "../MarkdownRenderer";
import { STREAM_SEGMENTATION_PROP } from "./streamSegmentationProp.js";
import rehypeStreamWordSegments from "./rehypeStreamWordSegments.js";

/**
 * 渲染 Markdown 流内容的通用组件，默认使用 MarkdownRenderer。
 * 可通过 renderer 属性注入自定义渲染器以便测试或扩展。
 */
function MarkdownStream({ text, renderer, className = "stream-text" }) {
  const Renderer = renderer || MarkdownRenderer;
  const supportsSegmentation = useMemo(
    () =>
      Renderer === MarkdownRenderer ||
      Renderer?.[STREAM_SEGMENTATION_PROP] === true,
    [Renderer],
  );
  const additionalRehypePlugins = useMemo(
    () => (supportsSegmentation ? [rehypeStreamWordSegments] : null),
    [supportsSegmentation],
  );

  const rendererProps = additionalRehypePlugins
    ? { rehypePlugins: additionalRehypePlugins }
    : {};

  return (
    <Renderer className={className} {...rendererProps}>
      {text}
    </Renderer>
  );
}

MarkdownStream.propTypes = {
  text: PropTypes.string,
  renderer: PropTypes.elementType,
  className: PropTypes.string,
};

export default MarkdownStream;
