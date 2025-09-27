import PropTypes from "prop-types";
import { useLanguage } from "@/context";
import { UserMenu } from "@/components/Header";
import SidebarActionItem from "@/components/Sidebar/SidebarActionItem.jsx";
import { SIDEBAR_ACTION_VARIANTS } from "@/components/Sidebar/sidebarActionVariants.js";
import { getBrandText } from "@/utils";

function Brand({ activeView, onShowDictionary, onShowFavorites }) {
  const { lang, t } = useLanguage();
  const brandText = getBrandText(lang);

  const dictionaryLabel = t.primaryNavDictionaryLabel || brandText;
  const libraryLabel = t.primaryNavLibraryLabel || t.favorites || "Favorites";
  const entriesLabel = t.primaryNavEntriesLabel || t.termLabel || "Entries";
  const dictionaryHint =
    t.primaryNavDictionaryDescription || t.searchTitle || dictionaryLabel;
  const libraryHint =
    t.primaryNavLibraryDescription || t.favoritesEmptyTitle || libraryLabel;

  const handleDictionary = () => {
    if (typeof onShowDictionary === "function") {
      onShowDictionary();
      return;
    }
    window.location.reload();
  };

  const handleLibrary = () => {
    if (typeof onShowFavorites === "function") {
      onShowFavorites();
    }
  };

  const navItems = [
    {
      key: "dictionary",
      label: dictionaryLabel,
      icon: "glancy-web",
      iconAlt: dictionaryLabel,
      onClick: handleDictionary,
      variant: SIDEBAR_ACTION_VARIANTS.default,
      isActive: activeView === "dictionary",
      className: "sidebar-nav-item sidebar-nav-item-dictionary",
      title: dictionaryHint,
    },
    {
      key: "favorites",
      label: libraryLabel,
      icon: "library",
      iconAlt: libraryLabel,
      onClick: handleLibrary,
      variant: SIDEBAR_ACTION_VARIANTS.default,
      isActive: activeView === "favorites",
      className: "sidebar-nav-item",
      title: libraryHint,
    },
  ];

  return (
    <div className="sidebar-brand">
      <div className="sidebar-brand-header">
        <nav className="sidebar-primary-nav" aria-label={dictionaryLabel}>
          {navItems.map((item) => (
            <SidebarActionItem
              key={item.key}
              icon={item.icon}
              iconAlt={item.iconAlt}
              iconTone="dark"
              label={item.label}
              onClick={item.onClick}
              variant={item.variant}
              isActive={item.isActive}
              className={item.className}
              aria-current={item.isActive ? "page" : undefined}
              title={item.title}
            />
          ))}
        </nav>
        <div className="mobile-user-menu">
          <UserMenu size={28} />
        </div>
      </div>
      <div className="sidebar-section-indicator">{entriesLabel}</div>
    </div>
  );
}

Brand.propTypes = {
  activeView: PropTypes.string,
  onShowDictionary: PropTypes.func,
  onShowFavorites: PropTypes.func,
};

Brand.defaultProps = {
  activeView: undefined,
  onShowDictionary: undefined,
  onShowFavorites: undefined,
};

export default Brand;
