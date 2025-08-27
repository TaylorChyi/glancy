import ListItem from "@/components/ui/ListItem";
import PropTypes from "prop-types";

function FavoritesPanel({
  favorites = [],
  onSelect,
  onUnfavorite,
  emptyMessage,
}) {
  if (!favorites.length) {
    return (
      <div className="display-content">
        <div className="display-term">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <ul className="panel-list">
      {favorites.map((w, i) => (
        <ListItem
          key={i}
          className="panel-item"
          text={w}
          textClassName="panel-term"
          onClick={() => onSelect?.(w)}
          actions={
            <button
              type="button"
              aria-label="unfavorite"
              className="panel-action"
              onClick={(e) => {
                e.stopPropagation();
                onUnfavorite?.(w);
              }}
            >
              ○
            </button>
          }
        />
      ))}
    </ul>
  );
}

FavoritesPanel.propTypes = {
  favorites: PropTypes.arrayOf(PropTypes.string),
  onSelect: PropTypes.func,
  onUnfavorite: PropTypes.func,
  emptyMessage: PropTypes.string,
};

export default FavoritesPanel;
