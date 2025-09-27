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
  const dictionaryDescription =
    t.primaryNavDictionaryDescription || t.searchTitle || "";
  const libraryLabel = t.primaryNavLibraryLabel || t.favorites || "Favorites";
  const libraryDescription =
    t.primaryNavLibraryDescription || t.favoritesEmptyTitle || "";
  const entriesLabel = t.primaryNavEntriesLabel || t.termLabel || "Entries";

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
      description: dictionaryDescription,
      icon: "glancy-web",
      iconAlt: dictionaryLabel,
      onClick: handleDictionary,
      variant: SIDEBAR_ACTION_VARIANTS.prominent,
      isActive:
        activeView === "dictionary" || activeView === "history" || !activeView,
      className: "sidebar-nav-item sidebar-nav-item-dictionary",
    },
    {
      key: "favorites",
      label: libraryLabel,
      description: libraryDescription,
      icon: "library",
      iconAlt: libraryLabel,
      onClick: handleLibrary,
      variant: SIDEBAR_ACTION_VARIANTS.default,
      isActive: activeView === "favorites",
      className: "sidebar-nav-item",
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
              label={item.label}
              description={item.description}
              onClick={item.onClick}
              variant={item.variant}
              isActive={item.isActive}
              className={item.className}
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
  activeView: "dictionary",
  onShowDictionary: undefined,
  onShowFavorites: undefined,
};

export default Brand;
