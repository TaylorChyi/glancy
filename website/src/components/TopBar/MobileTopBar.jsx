import PropTypes from "prop-types";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./MobileTopBar.module.css";
import { getBrandText } from "@/utils";
import OutputToolbar from "./OutputToolbar.jsx";

function MobileTopBar({
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
  onOpenSidebar,
  toolbarComponent = OutputToolbar,
  toolbarProps = {},
  ttsComponent,
}) {
  const brandText = getBrandText(lang);
  const ToolbarComponent = toolbarComponent;

  return (
    <header className={styles["mobile-topbar"]}>
      <button className={styles["topbar-btn"]} onClick={onOpenSidebar}>
        <ThemeIcon name="glancy-web" alt={brandText} width={24} height={24} />
      </button>
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

MobileTopBar.propTypes = {
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
  onOpenSidebar: PropTypes.func,
  toolbarComponent: PropTypes.elementType,
  toolbarProps: PropTypes.object,
  ttsComponent: PropTypes.elementType,
};

MobileTopBar.defaultProps = {
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
  onOpenSidebar: undefined,
  toolbarComponent: OutputToolbar,
  toolbarProps: {},
  ttsComponent: undefined,
};

export default MobileTopBar;
