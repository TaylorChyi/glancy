import PropTypes from "prop-types";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ListItem from "@/components/ui/ListItem";
import styles from "./FavoritesView.module.css";

function FavoritesView({
  favorites = [],
  onSelect,
  onUnfavorite,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  unfavoriteLabel,
  emptyIcon = "star-outline",
}) {
  if (!favorites.length) {
    return (
      <EmptyState
        iconName={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        actions={
          onEmptyAction && emptyActionLabel ? (
            <Button type="button" onClick={onEmptyAction}>
              {emptyActionLabel}
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <ul className={styles.grid}>
      {favorites.map((term) => (
        <ListItem
          key={term}
          className={styles.item}
          text={term}
          textClassName={styles.term}
          onClick={() => onSelect?.(term)}
          actions={
            <button
              type="button"
              aria-label={unfavoriteLabel}
              title={unfavoriteLabel}
              className={styles["unfavorite-button"]}
              onClick={(event) => {
                event.stopPropagation();
                onUnfavorite?.(term);
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

FavoritesView.propTypes = {
  favorites: PropTypes.arrayOf(PropTypes.string),
  onSelect: PropTypes.func,
  onUnfavorite: PropTypes.func,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  emptyActionLabel: PropTypes.string,
  onEmptyAction: PropTypes.func,
  unfavoriteLabel: PropTypes.string,
  emptyIcon: PropTypes.string,
};

export default FavoritesView;
