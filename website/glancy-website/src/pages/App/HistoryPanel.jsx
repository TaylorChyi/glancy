import ListItem from "@/components/ui/ListItem";
import PropTypes from "prop-types";

function HistoryPanel({ history = [], onSelect, emptyMessage }) {
  if (!history.length) {
    return (
      <div className="display-content">
        <div className="display-term">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <ul className="panel-list">
      {history.map((h, i) => (
        <ListItem
          key={i}
          className="panel-item"
          text={h}
          textClassName="panel-term"
          onClick={() => onSelect?.(h)}
        />
      ))}
    </ul>
  );
}

HistoryPanel.propTypes = {
  history: PropTypes.arrayOf(PropTypes.string),
  onSelect: PropTypes.func,
  emptyMessage: PropTypes.string,
};

export default HistoryPanel;
