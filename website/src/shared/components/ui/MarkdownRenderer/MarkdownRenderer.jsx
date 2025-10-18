/**
 * 背景：
 *  - 历史版本将折叠逻辑、断行注入与渲染策略全部堆叠在单文件中，
 *    使得结构化 lint 无法通过并削弱后续扩展的可读性。
 * 目的：
 *  - 通过拆分渲染子模块，将策略选择留在门面组件中，
 *    使结构规则恢复生效并为后续扩展不同渲染模式预留插槽。
 * 关键决策与取舍：
 *  - 采用门面模式：MarkdownRenderer 只负责根据用户偏好选择 Plain/Dynamic 渲染器；
 *  - 将断行注入、折叠渲染拆分到 hooks/renderers 子目录，避免互相耦合；
 *  - 保留向下兼容的 props 签名，确保既有调用方与测试无需调整。
 * 影响范围：
 *  - MarkdownRenderer 入口文件；动态与静态渲染逻辑被迁移至独立模块；
 *  - ESLint 结构化规则可重新覆盖该文件。
 * 演进与TODO：
 *  - 若后续需要更多渲染模式，可在 renderers 目录内新增实现并在此处路由。
 */
import PropTypes from "prop-types";
import {
  MARKDOWN_RENDERING_MODE_PLAIN,
  useSettingsStore,
} from "@core/store/settings";
import DynamicMarkdownRenderer from "./renderers/DynamicMarkdownRenderer.jsx";
import PlainMarkdownRenderer from "./renderers/PlainMarkdownRenderer.jsx";

export default function MarkdownRenderer(props) {
  const { children } = props;
  const markdownMode = useSettingsStore((state) => state.markdownRenderingMode);

  if (!children) {
    return null;
  }

  if (markdownMode === MARKDOWN_RENDERING_MODE_PLAIN) {
    return <PlainMarkdownRenderer {...props} />;
  }

  return <DynamicMarkdownRenderer {...props} />;
}

MarkdownRenderer.propTypes = {
  children: PropTypes.node,
  remarkPlugins: PropTypes.arrayOf(PropTypes.func),
  rehypePlugins: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.func, PropTypes.array]),
  ),
  components: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  ),
};
