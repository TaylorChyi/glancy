import PropTypes from "prop-types";
import DictionaryMarkdown from "./DictionaryMarkdown.jsx";
import { normalizeDictionaryMarkdown } from "@features/dictionary-experience/markdown/dictionaryMarkdownNormalizer.js";

export default function MarkdownArticle({ markdown, className }) {
  const polished = normalizeDictionaryMarkdown(markdown);
  return (
    <article className={className}>
      <DictionaryMarkdown>{polished}</DictionaryMarkdown>
    </article>
  );
}

MarkdownArticle.propTypes = {
  markdown: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
};
