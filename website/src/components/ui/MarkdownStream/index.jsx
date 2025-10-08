import { useMemo } from "react";
import PropTypes from "prop-types";
import MarkdownRenderer from "../MarkdownRenderer";
import { resolveSegmentationStrategy } from "./segmentationStrategies.js";

/**
 * 渲染 Markdown 流内容的通用组件，默认使用 MarkdownRenderer。
 * 通过 segmentation 策略控制是否注入额外的流式标记，默认保持与静态 Markdown 一致。
 */
function MarkdownStream({
  text,
  renderer,
  className = "stream-text",
  segmentation = "none",
}) {
  const Renderer = renderer || MarkdownRenderer;

  const strategy = useMemo(
    () => resolveSegmentationStrategy(segmentation),
    [segmentation],
  );

  const rendererProps = useMemo(() => {
    const plugins = strategy.resolvePlugins({
      Renderer,
      defaultRenderer: MarkdownRenderer,
    });
    return plugins ? { rehypePlugins: plugins } : {};
  }, [Renderer, strategy]);

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
  segmentation: PropTypes.oneOf(["none", "word"]),
};

export default MarkdownStream;
