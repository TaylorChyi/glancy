import PropTypes from "prop-types";
import { useLanguage, useUser } from "@/context";
import ThemeIcon from "@/components/ui/Icon";
import common from "./TopBarCommon.module.css";

function TopBarActions({
  favorited = false,
  onToggleFavorite,
  canFavorite = false,
  canDelete = false,
  onDelete,
}) {
  const { t } = useLanguage();
  const { user } = useUser();

  if (!user) return null;

  const showFavorite = canFavorite && typeof onToggleFavorite === "function";
  const showDelete = canDelete && typeof onDelete === "function";

  if (!showFavorite && !showDelete) {
    return null;
  }

  const favoriteLabel = favorited
    ? (t.favoriteRemove ?? t.favoriteAction)
    : t.favoriteAction;
  const deleteLabel = t.deleteButton ?? t.deleteAction ?? "Delete";

  return (
    <div className={common["topbar-right"]}>
      <div className={common["action-group"]}>
        {showFavorite && (
          <button
            type="button"
            className={common["action-button"]}
            data-active={favorited ? "true" : undefined}
            onClick={onToggleFavorite}
            aria-label={favoriteLabel}
            title={favoriteLabel}
          >
            {favorited ? (
              <ThemeIcon name="star-solid" width={22} height={22} />
            ) : (
              <ThemeIcon name="star-outline" width={22} height={22} />
            )}
          </button>
        )}
        {showDelete && (
          <button
            type="button"
            className={`${common["action-button"]} ${common["delete-button"]}`}
            onClick={onDelete}
            aria-label={deleteLabel}
            title={deleteLabel}
          >
            <ThemeIcon name="trash" width={20} height={20} />
          </button>
        )}
      </div>
    </div>
  );
}

TopBarActions.propTypes = {
  favorited: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
  canFavorite: PropTypes.bool,
  canDelete: PropTypes.bool,
  onDelete: PropTypes.func,
};

TopBarActions.defaultProps = {
  favorited: false,
  onToggleFavorite: undefined,
  canFavorite: false,
  canDelete: false,
  onDelete: undefined,
};

export default TopBarActions;
