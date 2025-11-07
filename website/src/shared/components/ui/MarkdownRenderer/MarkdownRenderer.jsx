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
