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
  canShare = false,
  onShare,
  canReport = false,
  onReport,
}) {
  const { t } = useLanguage();
  const { user } = useUser();

  if (!user) return null;

  const showFavorite = canFavorite && typeof onToggleFavorite === "function";
  const showDelete = canDelete && typeof onDelete === "function";
  const showShare = canShare && typeof onShare === "function";
  const showReport = canReport && typeof onReport === "function";

  if (!showFavorite && !showDelete && !showShare && !showReport) {
    return null;
  }

  const favoriteLabel = favorited
    ? (t.favoriteRemove ?? t.favoriteAction)
    : t.favoriteAction;
  const deleteLabel = t.deleteButton ?? t.deleteAction ?? "Delete";
  const shareLabel = t.share ?? "Share";
  const reportLabel = t.report ?? "Report";

  const actionConfigs = [
    showFavorite
      ? {
          key: "favorite",
          label: favoriteLabel,
          onClick: onToggleFavorite,
          className: common["action-button"],
          icon: favorited ? (
            <ThemeIcon name="star-solid" width={22} height={22} />
          ) : (
            <ThemeIcon name="star-outline" width={22} height={22} />
          ),
          active: favorited,
        }
      : null,
    showDelete
      ? {
          key: "delete",
          label: deleteLabel,
          onClick: onDelete,
          className: `${common["action-button"]} ${common["delete-button"]}`,
          icon: <ThemeIcon name="trash" width={20} height={20} />,
        }
      : null,
    showShare
      ? {
          key: "share",
          label: shareLabel,
          onClick: onShare,
          className: `${common["action-button"]} ${common["share-button"]}`,
          icon: <ThemeIcon name="link" width={20} height={20} />,
        }
      : null,
    showReport
      ? {
          key: "report",
          label: reportLabel,
          onClick: onReport,
          className: `${common["action-button"]} ${common["report-button"]}`,
          icon: <ThemeIcon name="flag" width={20} height={20} />,
        }
      : null,
  ].filter(Boolean);

  return (
    <div className={common["topbar-right"]}>
      <div className={common["action-group"]}>
        {actionConfigs.map(
          ({ key, label, onClick, className, icon, active }) => (
            <button
              key={key}
              type="button"
              className={className}
              data-active={active ? "true" : undefined}
              onClick={onClick}
              aria-label={label}
              title={label}
            >
              {icon}
            </button>
          ),
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
  canShare: PropTypes.bool,
  onShare: PropTypes.func,
  canReport: PropTypes.bool,
  onReport: PropTypes.func,
};

TopBarActions.defaultProps = {
  favorited: false,
  onToggleFavorite: undefined,
  canFavorite: false,
  canDelete: false,
  onDelete: undefined,
  canShare: false,
  onShare: undefined,
  canReport: false,
  onReport: undefined,
};

export default TopBarActions;
