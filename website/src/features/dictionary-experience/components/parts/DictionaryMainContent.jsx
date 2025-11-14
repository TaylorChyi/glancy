import PropTypes from "prop-types";
import HistoryDisplay from "@shared/components/ui/HistoryDisplay";
import { DictionaryEntryView } from "@shared/components/ui/DictionaryEntry";
import EmptyState from "@shared/components/ui/EmptyState";
import LibraryLandingView from "@app/pages/App/LibraryLandingView.jsx";

const createHistoryEmptyAction = (handleShowDictionary, focusInput) => () => {
  handleShowDictionary();
  focusInput();
};

function LibraryContent({ label }) {
  return <LibraryLandingView label={label} />;
}

function HistoryContent({ onEmptyAction, onSelect }) {
  return <HistoryDisplay onEmptyAction={onEmptyAction} onSelect={onSelect} />;
}

function DictionaryEntryContent({ entry, finalText, loading }) {
  return (
    <DictionaryEntryView entry={entry} preview={finalText} isLoading={loading} />
  );
}

function DictionarySearchEmptyState({ searchEmptyState }) {
  return (
    <EmptyState
      tone="plain"
      title={searchEmptyState.title}
      description={searchEmptyState.description}
    />
  );
}

const renderLibraryOrHistoryContent = ({
  viewState,
  libraryLandingLabel,
  handleShowDictionary,
  focusInput,
  handleSelectHistory,
}) => {
  if (viewState.isLibrary) {
    return <LibraryContent label={libraryLandingLabel} />;
  }
  if (viewState.isHistory) {
    return (
      <HistoryContent
        onEmptyAction={createHistoryEmptyAction(
          handleShowDictionary,
          focusInput,
        )}
        onSelect={handleSelectHistory}
      />
    );
  }
  return null;
};

function DictionaryMainContentView({
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
  const prioritizedContent = renderLibraryOrHistoryContent({
    viewState,
    libraryLandingLabel,
    handleShowDictionary,
    focusInput,
    handleSelectHistory,
  });
  if (prioritizedContent) return prioritizedContent;
  return shouldRenderEntry ? (
    <DictionaryEntryContent entry={entry} finalText={finalText} loading={loading} />
  ) : (
    <DictionarySearchEmptyState searchEmptyState={searchEmptyState} />
  );
}

function DictionaryMainContent(props) {
  return <DictionaryMainContentView {...props} />;
}

LibraryContent.propTypes = {
  label: PropTypes.string.isRequired,
};

HistoryContent.propTypes = {
  onEmptyAction: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};

DictionaryEntryContent.propTypes = {
  entry: PropTypes.shape({}),
  finalText: PropTypes.string,
  loading: PropTypes.bool,
};

DictionaryEntryContent.defaultProps = {
  entry: undefined,
  finalText: "",
  loading: false,
};

DictionarySearchEmptyState.propTypes = {
  searchEmptyState: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
};

DictionaryMainContentView.propTypes = {
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

DictionaryMainContentView.defaultProps = {
  entry: undefined,
  finalText: "",
  loading: false,
};

DictionaryMainContent.propTypes = DictionaryMainContentView.propTypes;

DictionaryMainContent.defaultProps = DictionaryMainContentView.defaultProps;

export default DictionaryMainContent;
