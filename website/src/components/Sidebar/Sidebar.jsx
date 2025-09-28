import { forwardRef, useMemo } from "react";
import PropTypes from "prop-types";
import { useLanguage } from "@/context";
import { useIsMobile } from "@/utils";
import SidebarHistory from "./SidebarHistory.jsx";
import SidebarUser from "./SidebarUser.jsx";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./Sidebar.module.css";

function Sidebar(
  {
    isMobile: mobileProp,
    open = false,
    onClose,
    onShowDictionary,
    onShowFavorites,
    activeView,
    onSelectHistory,
  },
  ref,
) {
  const defaultMobile = useIsMobile();
  const isMobile = mobileProp ?? defaultMobile;
  const { t, lang } = useLanguage();

  const headerLabel = useMemo(() => {
    if (t.sidebarNavigationLabel) return t.sidebarNavigationLabel;
    return lang === "zh" ? "导航" : "Navigation";
  }, [lang, t.sidebarNavigationLabel]);

  const dictionaryLabel = t.primaryNavDictionaryLabel || "Glancy";
  const libraryLabel =
    t.primaryNavLibraryLabel ||
    t.favorites ||
    t.primaryNavEntriesLabel ||
    "Library";
  const historyTitle =
    t.searchHistory || (lang === "zh" ? "搜索记录" : "History");
  const entriesTitle =
    t.primaryNavEntriesLabel || (lang === "zh" ? "词条" : "Entries");

  const handleDictionary = () => {
    if (typeof onShowDictionary === "function") {
      onShowDictionary();
      return;
    }
    window.location.reload();
  };

  const handleFavorites = () => {
    if (typeof onShowFavorites === "function") {
      onShowFavorites();
    }
  };

  const appNavItems = [
    {
      key: "dictionary",
      label: dictionaryLabel,
      icon: "glancy-web",
      onClick: handleDictionary,
      active: activeView === "dictionary",
      testId: "sidebar-nav-dictionary",
    },
    {
      key: "favorites",
      label: libraryLabel,
      icon: "library",
      onClick: handleFavorites,
      active: activeView === "favorites",
      testId: "sidebar-nav-favorites",
    },
  ];

  return (
    <>
      {isMobile && open && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
      <aside
        ref={ref}
        data-testid="sidebar"
        className={`sidebar${isMobile ? (open ? " mobile-open" : "") : ""} ${styles.container}`}
      >
        <div className={styles.top} data-testid="sidebar-header">
          <div className={styles.apps} role="group" aria-label={headerLabel}>
            {appNavItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={styles["app-button"]}
                data-active={item.active}
                aria-pressed={item.active}
                onClick={item.onClick}
                title={typeof item.label === "string" ? item.label : undefined}
                data-testid={item.testId}
              >
                <ThemeIcon
                  name={item.icon}
                  alt={typeof item.label === "string" ? item.label : undefined}
                  width={18}
                  height={18}
                />
              </button>
            ))}
          </div>
        </div>
        <nav
          className={styles.entries}
          aria-label={historyTitle || entriesTitle}
          data-testid="sidebar-scroll"
        >
          <SidebarHistory onSelectHistory={onSelectHistory} />
        </nav>
        <footer className={styles.footer} data-testid="sidebar-footer">
          <SidebarUser />
        </footer>
      </aside>
    </>
  );
}

Sidebar.propTypes = {
  isMobile: PropTypes.bool,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onShowDictionary: PropTypes.func,
  onShowFavorites: PropTypes.func,
  activeView: PropTypes.string,
  onSelectHistory: PropTypes.func,
};

Sidebar.defaultProps = {
  isMobile: undefined,
  open: false,
  onClose: undefined,
  onShowDictionary: undefined,
  onShowFavorites: undefined,
  activeView: undefined,
  onSelectHistory: undefined,
};

export default forwardRef(Sidebar);
