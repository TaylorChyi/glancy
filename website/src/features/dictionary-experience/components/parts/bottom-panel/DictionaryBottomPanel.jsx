import PropTypes from "prop-types";
import BottomPanelSwitcher from "../../BottomPanelSwitcher.jsx";
import { DockedICP } from "@shared/components/ui/ICP";
import BottomPanelSearch from "./BottomPanelSearch.jsx";
import BottomPanelActions from "./BottomPanelActions.jsx";

const renderBottomPanelSwitcher = ({
  bottomPanelMode,
  inputProps,
  actionPanelProps,
  hasDefinition,
  onSearchButtonClick,
  handleInputFocusChange,
}) => (
  <BottomPanelSwitcher
    mode={bottomPanelMode}
    searchContent={
      <BottomPanelSearch
        inputProps={inputProps}
        handleInputFocusChange={handleInputFocusChange}
      />
    }
    actionsContent={
      <BottomPanelActions
        actionPanelProps={actionPanelProps}
        onSearchButtonClick={onSearchButtonClick}
        searchButtonLabel={inputProps.searchButtonLabel}
        hasDefinition={hasDefinition}
      />
    }
  />
);

function DictionaryBottomPanelView(props) {
  return (
    <>
      {renderBottomPanelSwitcher(props)}
      <DockedICP />
    </>
  );
}

function DictionaryBottomPanel(props) {
  return <DictionaryBottomPanelView {...props} />;
}

DictionaryBottomPanelView.propTypes = {
  bottomPanelMode: PropTypes.string.isRequired,
  inputProps: PropTypes.shape({
    searchButtonLabel: PropTypes.string.isRequired,
  }).isRequired,
  actionPanelProps: PropTypes.shape({}),
  hasDefinition: PropTypes.bool.isRequired,
  onSearchButtonClick: PropTypes.func.isRequired,
  handleInputFocusChange: PropTypes.func.isRequired,
};

DictionaryBottomPanelView.defaultProps = {
  actionPanelProps: undefined,
};

DictionaryBottomPanel.propTypes = DictionaryBottomPanelView.propTypes;

DictionaryBottomPanel.defaultProps = DictionaryBottomPanelView.defaultProps;

export default DictionaryBottomPanel;
