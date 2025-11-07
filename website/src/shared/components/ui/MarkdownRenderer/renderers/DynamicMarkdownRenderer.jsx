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
