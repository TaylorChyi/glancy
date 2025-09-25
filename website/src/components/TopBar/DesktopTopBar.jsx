import PropTypes from "prop-types";
import styles from "./DesktopTopBar.module.css";
import common from "./TopBarCommon.module.css";
import TopBarActions from "./TopBarActions.jsx";
import ThemeIcon from "@/components/ui/Icon";
import OutputToolbar from "./OutputToolbar.jsx";
import { useLanguage } from "@/context";

function DesktopTopBar({
  term = "",
  lang,
  showBack = false,
  onBack,
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
  const { t } = useLanguage();
  const ToolbarComponent = toolbarComponent;

  return (
    <header className={styles["desktop-topbar"]}>
      <div className={styles.left}>
        <button
          type="button"
          className={`${common["back-btn"]} ${showBack ? styles.visible : styles.hidden}`}
          onClick={onBack}
          aria-label={t.back}
        >
          <ThemeIcon
            name="arrow-left"
            alt=""
            width={24}
            height={24}
            aria-hidden="true"
          />
        </button>
        {term && (
          <div className={`${common["term-text"]} ${styles["term-text"]}`}>
            <span>{term}</span>
          </div>
        )}
      </div>
      <div className={styles.right}>
        <ToolbarComponent
          term={term}
          lang={lang}
          onReoutput={onReoutput}
          disabled={!canReoutput || isLoading}
          versions={versions}
          activeVersionId={activeVersionId}
          onNavigate={onNavigateVersion}
          ttsComponent={ttsComponent}
          {...toolbarProps}
        />
        <TopBarActions
          favorited={favorited}
          onToggleFavorite={onToggleFavorite}
          canFavorite={canFavorite}
          canDelete={canDelete}
          onDelete={onDelete}
          canShare={canShare}
          onShare={onShare}
          canReport={canReport}
          onReport={onReport}
        />
      </div>
    </header>
  );
}

DesktopTopBar.propTypes = {
  term: PropTypes.string,
  lang: PropTypes.string,
  showBack: PropTypes.bool,
  onBack: PropTypes.func,
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
  showBack: false,
  onBack: undefined,
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
