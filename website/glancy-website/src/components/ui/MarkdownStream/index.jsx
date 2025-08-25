import ReactMarkdown from "react-markdown";

/**
 * 渲染 Markdown 流内容的通用组件，默认使用 ReactMarkdown。
 * 可通过 renderer 属性注入自定义渲染器以便测试或扩展。
 */
function MarkdownStream({ text, renderer }) {
  const Renderer = renderer || ReactMarkdown;
  return <Renderer className="stream-text">{text}</Renderer>;
}

export default MarkdownStream;
