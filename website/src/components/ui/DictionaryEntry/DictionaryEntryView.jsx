import PropTypes from "prop-types";
import DictionaryEntry from "./DictionaryEntry.jsx";
import DictionaryEntryPlaceholder from "./DictionaryEntryPlaceholder.jsx";
import layoutStyles from "./DictionaryEntryView.module.css";

function DictionaryEntryView({ entry, preview, isLoading }) {
  if (entry) {
    return (
      <section className={`${layoutStyles.entry} entry`}>
        <DictionaryEntry
          entry={entry}
          className={`${layoutStyles.definition} entry__definition`}
        />
      </section>
    );
  }

  return <DictionaryEntryPlaceholder preview={preview} isLoading={isLoading} />;
}

DictionaryEntryView.propTypes = {
  entry: PropTypes.object,
  preview: PropTypes.string,
  isLoading: PropTypes.bool,
};

DictionaryEntryView.defaultProps = {
  entry: null,
  preview: "",
  isLoading: false,
};

export default DictionaryEntryView;
