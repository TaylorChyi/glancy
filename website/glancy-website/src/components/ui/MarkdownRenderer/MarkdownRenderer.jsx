import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * 通用 Markdown 渲染组件，支持 GFM 语法。
 * 可作为统一的 Markdown 渲染入口，便于未来扩展。
 */
function MarkdownRenderer({ children, ...props }) {
  if (!children) return null;
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} {...props}>
      {children}
    </ReactMarkdown>
  );
}

export default MarkdownRenderer;
