import PropTypes from "prop-types";
import DictionaryEntry from "./DictionaryEntry.jsx";
import DictionaryEntryPlaceholder from "./DictionaryEntryPlaceholder.jsx";
import layoutStyles from "./DictionaryEntryView.module.css";

function DictionaryEntryView({ entry, preview, isLoading, actions }) {
  if (entry) {
    return (
      <section className={`${layoutStyles.entry} entry`}>
        {/* 使用 grid 保证释义与工具栏在各断点下维持垂直顺序，避免旧 flex 布局并排问题。 */}
        <DictionaryEntry
          entry={entry}
          className={`${layoutStyles.definition} entry__definition`}
        />
        {actions || null}
      </section>
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
