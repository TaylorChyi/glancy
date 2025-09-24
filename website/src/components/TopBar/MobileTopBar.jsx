import PropTypes from "prop-types";
import ThemeIcon from "@/components/ui/Icon";
import TopBarActions from "./TopBarActions.jsx";
import common from "./TopBarCommon.module.css";
import styles from "./MobileTopBar.module.css";
import { getBrandText } from "@/utils";
import OutputToolbar from "./OutputToolbar.jsx";
import { useLanguage } from "@/context";

function MobileTopBar({
  term = "",
  lang,
  showBack = false,
  onBack,
  favorited = false,
  onToggleFavorite,
  canFavorite = false,
  canDelete = false,
  onDelete,
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
  const { t } = useLanguage();
  const ToolbarComponent = toolbarComponent;

  return (
    <header className={styles["mobile-topbar"]}>
      <button className={styles["topbar-btn"]} onClick={onOpenSidebar}>
        <ThemeIcon name="glancy-web" alt={brandText} width={24} height={24} />
      </button>
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
        />
      </div>
    </header>
  );
}

MobileTopBar.propTypes = {
  term: PropTypes.string,
  lang: PropTypes.string,
  showBack: PropTypes.bool,
  onBack: PropTypes.func,
  favorited: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
  canFavorite: PropTypes.bool,
  canDelete: PropTypes.bool,
  onDelete: PropTypes.func,
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
  showBack: false,
  onBack: undefined,
  favorited: false,
  onToggleFavorite: undefined,
  canFavorite: false,
  canDelete: false,
  onDelete: undefined,
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
