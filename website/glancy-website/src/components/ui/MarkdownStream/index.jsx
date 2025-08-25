import MarkdownRenderer from "../MarkdownRenderer";

/**
 * 渲染 Markdown 流内容的通用组件，默认使用 MarkdownRenderer。
 * 可通过 renderer 属性注入自定义渲染器以便测试或扩展。
 */
function MarkdownStream({ text, renderer }) {
  const Renderer = renderer || MarkdownRenderer;
  return <Renderer className="stream-text">{text}</Renderer>;
}

export default MarkdownStream;
