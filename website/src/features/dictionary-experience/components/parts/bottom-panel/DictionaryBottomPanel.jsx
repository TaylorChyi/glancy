import PropTypes from "prop-types";
import BottomPanelSwitcher from "../../BottomPanelSwitcher.jsx";
import { DockedICP } from "@shared/components/ui/ICP";
import BottomPanelSearch from "./BottomPanelSearch.jsx";
import BottomPanelActions from "./BottomPanelActions.jsx";

function DictionaryBottomPanel({
  bottomPanelMode,
  inputProps,
  actionPanelProps,
  hasDefinition,
  onSearchButtonClick,
  handleInputFocusChange,
}) {
  return (
    <>
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
      <DockedICP />
    </>
  );
}

DictionaryBottomPanel.propTypes = {
  bottomPanelMode: PropTypes.string.isRequired,
  inputProps: PropTypes.shape({
    searchButtonLabel: PropTypes.string.isRequired,
  }).isRequired,
  actionPanelProps: PropTypes.shape({}),
  hasDefinition: PropTypes.bool.isRequired,
  onSearchButtonClick: PropTypes.func.isRequired,
  handleInputFocusChange: PropTypes.func.isRequired,
};

DictionaryBottomPanel.defaultProps = {
  actionPanelProps: undefined,
};

export default DictionaryBottomPanel;
