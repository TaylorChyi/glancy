import PropTypes from "prop-types";
import HistoryDisplay from "@shared/components/ui/HistoryDisplay";
import { DictionaryEntryView } from "@shared/components/ui/DictionaryEntry";
import EmptyState from "@shared/components/ui/EmptyState";
import LibraryLandingView from "@app/pages/App/LibraryLandingView.jsx";

function DictionaryMainContent({
  viewState,
  libraryLandingLabel,
  handleShowDictionary,
  focusInput,
  handleSelectHistory,
  shouldRenderEntry,
  entry,
  finalText,
  loading,
  searchEmptyState,
}) {
  if (viewState.isLibrary) {
    return <LibraryLandingView label={libraryLandingLabel} />;
  }
  if (viewState.isHistory) {
    return (
      <HistoryDisplay
        onEmptyAction={() => {
          handleShowDictionary();
          focusInput();
        }}
        onSelect={handleSelectHistory}
      />
    );
  }
  if (shouldRenderEntry) {
    return (
      <DictionaryEntryView entry={entry} preview={finalText} isLoading={loading} />
    );
  }
  return (
    <EmptyState
      tone="plain"
      title={searchEmptyState.title}
      description={searchEmptyState.description}
    />
  );
}

DictionaryMainContent.propTypes = {
  viewState: PropTypes.shape({
    isLibrary: PropTypes.bool,
    isHistory: PropTypes.bool,
    isDictionary: PropTypes.bool,
  }).isRequired,
  libraryLandingLabel: PropTypes.string.isRequired,
  handleShowDictionary: PropTypes.func.isRequired,
  focusInput: PropTypes.func.isRequired,
  handleSelectHistory: PropTypes.func.isRequired,
  shouldRenderEntry: PropTypes.bool.isRequired,
  entry: PropTypes.shape({}),
  finalText: PropTypes.string,
  loading: PropTypes.bool,
  searchEmptyState: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
};

DictionaryMainContent.defaultProps = {
  entry: undefined,
  finalText: "",
  loading: false,
};

export default DictionaryMainContent;
