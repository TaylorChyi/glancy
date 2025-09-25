import PropTypes from "prop-types";
import styles from "./DesktopTopBar.module.css";
import OutputToolbar from "./OutputToolbar.jsx";

function DesktopTopBar({
  term = "",
  lang,
  favorited = false,
  onToggleFavorite,
  canFavorite = false,
  canDelete = false,
  onDelete,
  canShare = false,
  onShare,
  canReport = false,
  onReport,
  canReoutput = false,
  onReoutput,
  versions = [],
  activeVersionId,
  onNavigateVersion,
  isLoading = false,
  toolbarComponent = OutputToolbar,
  toolbarProps = {},
  ttsComponent,
}) {
  const ToolbarComponent = toolbarComponent;

  return (
    <header className={styles["desktop-topbar"]}>
      <div className={styles["toolbar-container"]}>
        <ToolbarComponent
          term={term}
          lang={lang}
          onReoutput={onReoutput}
          disabled={!canReoutput || isLoading}
          versions={versions}
          activeVersionId={activeVersionId}
          onNavigate={onNavigateVersion}
          ttsComponent={ttsComponent}
          favorited={favorited}
          onToggleFavorite={onToggleFavorite}
          canFavorite={canFavorite}
          canDelete={canDelete}
          onDelete={onDelete}
          canShare={canShare}
          onShare={onShare}
          canReport={canReport}
          onReport={onReport}
          {...toolbarProps}
        />
      </div>
    </header>
  );
}

DesktopTopBar.propTypes = {
  term: PropTypes.string,
  lang: PropTypes.string,
  favorited: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
  canFavorite: PropTypes.bool,
  canDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  canShare: PropTypes.bool,
  onShare: PropTypes.func,
  canReport: PropTypes.bool,
  onReport: PropTypes.func,
  canReoutput: PropTypes.bool,
  onReoutput: PropTypes.func,
  versions: PropTypes.arrayOf(PropTypes.object),
  activeVersionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onNavigateVersion: PropTypes.func,
  isLoading: PropTypes.bool,
  toolbarComponent: PropTypes.elementType,
  toolbarProps: PropTypes.object,
  ttsComponent: PropTypes.elementType,
};

DesktopTopBar.defaultProps = {
  term: "",
  lang: "en",
  favorited: false,
  onToggleFavorite: undefined,
  canFavorite: false,
  canDelete: false,
  onDelete: undefined,
  canShare: false,
  onShare: undefined,
  canReport: false,
  onReport: undefined,
  canReoutput: false,
  onReoutput: undefined,
  versions: [],
  activeVersionId: undefined,
  onNavigateVersion: undefined,
  isLoading: false,
  toolbarComponent: OutputToolbar,
  toolbarProps: {},
  ttsComponent: undefined,
};

export default DesktopTopBar;
