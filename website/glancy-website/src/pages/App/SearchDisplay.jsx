import DictionaryEntry from "@/components/ui/DictionaryEntry";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import MarkdownStream from "@/components/ui/MarkdownStream";
import PropTypes from "prop-types";

function SearchDisplay({ loading, entry, streamText, finalText, placeholder }) {
  if (loading) {
    return <MarkdownStream text={streamText || "..."} />;
  }
  if (entry) {
    return <DictionaryEntry entry={entry} />;
  }
  if (finalText) {
    return (
      <MarkdownRenderer className="stream-text">{finalText}</MarkdownRenderer>
    );
  }
  if (streamText) {
    return <MarkdownStream text={streamText} />;
  }
  return (
    <div className="display-content">
      <div className="display-term">{placeholder}</div>
    </div>
  );
}

SearchDisplay.propTypes = {
  loading: PropTypes.bool,
  entry: PropTypes.object,
  streamText: PropTypes.string,
  finalText: PropTypes.string,
  placeholder: PropTypes.string,
};

export default SearchDisplay;
