import PropTypes from "prop-types";
import ActionPanel from "../../panels/ActionPanel.jsx";

function BottomPanelActions({ actionPanelProps, onSearchButtonClick, searchButtonLabel, hasDefinition }) {
  if (!hasDefinition) {
    return null;
  }
  return (
    <ActionPanel
      actionBarProps={actionPanelProps ?? {}}
      onRequestSearch={onSearchButtonClick}
      searchButtonLabel={searchButtonLabel}
    />
  );
}

BottomPanelActions.propTypes = {
  actionPanelProps: PropTypes.shape({}),
  onSearchButtonClick: PropTypes.func.isRequired,
  searchButtonLabel: PropTypes.string.isRequired,
  hasDefinition: PropTypes.bool.isRequired,
};

BottomPanelActions.defaultProps = {
  actionPanelProps: undefined,
};

export default BottomPanelActions;
