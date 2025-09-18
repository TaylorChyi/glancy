import DictionaryEntry from "./DictionaryEntry.jsx";
import DictionaryEntryPlaceholder from "./DictionaryEntryPlaceholder.jsx";

function DictionaryEntryView({ entry, preview, isLoading }) {
  if (entry) {
    return <DictionaryEntry entry={entry} />;
  }

  return <DictionaryEntryPlaceholder preview={preview} isLoading={isLoading} />;
}

export default DictionaryEntryView;
