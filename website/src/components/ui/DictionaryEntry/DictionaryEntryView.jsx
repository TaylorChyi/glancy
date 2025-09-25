import PropTypes from "prop-types";
import DictionaryEntry from "./DictionaryEntry.jsx";
import DictionaryEntryPlaceholder from "./DictionaryEntryPlaceholder.jsx";

function DictionaryEntryView({ entry, preview, isLoading, actions }) {
  if (entry) {
    return (
      <>
        <DictionaryEntry entry={entry} />
        {actions || null}
      </>
    );
  }

  return <DictionaryEntryPlaceholder preview={preview} isLoading={isLoading} />;
}

DictionaryEntryView.propTypes = {
  entry: PropTypes.object,
  preview: PropTypes.string,
  isLoading: PropTypes.bool,
  actions: PropTypes.node,
};

DictionaryEntryView.defaultProps = {
  entry: null,
  preview: "",
  isLoading: false,
  actions: null,
};

export default DictionaryEntryView;
