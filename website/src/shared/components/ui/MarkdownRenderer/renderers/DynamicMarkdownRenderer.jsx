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
  const components = useMarkdownComponents(injectBreaks, additionalComponents);
  const remarkPlugins = useMarkdownRemarkPlugins(additionalRemarkPlugins);
  const rehypePlugins = useMarkdownRehypePlugins(additionalRehypePlugins);

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

function useMarkdownComponents(injectBreaks, additionalComponents) {
  const baseComponents = useMemo(
    () =>
      buildMarkdownComponents({
        injectBreaks,
      }),
    [injectBreaks],
  );

  return useMemo(
    () => ({
      ...baseComponents,
      ...(additionalComponents ?? {}),
    }),
    [additionalComponents, baseComponents],
  );
}

function useMarkdownRemarkPlugins(additionalRemarkPlugins) {
  return useMemo(
    () => [remarkGfm, ...(additionalRemarkPlugins ?? [])],
    [additionalRemarkPlugins],
  );
}

function useMarkdownRehypePlugins(additionalRehypePlugins) {
  return useMemo(
    () => [rehypeCollapsibleSections, ...(additionalRehypePlugins ?? [])],
    [additionalRehypePlugins],
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
