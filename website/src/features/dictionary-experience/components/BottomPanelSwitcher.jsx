import PropTypes from "prop-types";

export default function BottomPanelSwitcher({
  mode,
  searchContent,
  actionsContent,
}) {
  const content = mode === "actions" ? actionsContent : searchContent;

  return <div data-mode={mode}>{content}</div>;
}

BottomPanelSwitcher.propTypes = {
  mode: PropTypes.oneOf(["search", "actions"]).isRequired,
  searchContent: PropTypes.node.isRequired,
  actionsContent: PropTypes.node.isRequired,
};
