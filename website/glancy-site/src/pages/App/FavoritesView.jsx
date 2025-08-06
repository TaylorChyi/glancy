import ListItem from '@/components/ui/ListItem'

function FavoritesView({ favorites = [], onSelect, onUnfavorite, emptyMessage }) {
  if (!favorites.length) {
    return (
      <div className="display-content">
        <div className="display-term">{emptyMessage}</div>
      </div>
    )
  }

  return (
    <ul className="favorites-grid-display">
      {favorites.map((w, i) => (
        <ListItem
          key={i}
          className="favorite-item"
          text={w}
          textClassName="favorite-term"
          onClick={() => onSelect?.(w)}
          actions={(
            <button
              type="button"
              aria-label="unfavorite"
              className="unfavorite-btn"
              onClick={(e) => {
                e.stopPropagation()
                onUnfavorite?.(w)
              }}
            >
              ○
            </button>
          )}
        />
      ))}
    </ul>
  )
}

export default FavoritesView
