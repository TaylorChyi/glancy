import PropTypes from "prop-types";
import { useLanguage } from "@/context";
import { UserMenu } from "@/components/Header";
import ThemeIcon from "@/components/ui/Icon";
import { getBrandText } from "@/utils";

function PrimaryNavItem({ icon, iconAlt, label, onClick, isActive, title }) {
  return (
    <button
      type="button"
      className="primary-nav-item"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      title={title}
    >
      <span className="primary-nav-item-indicator" aria-hidden="true" />
      <span className="primary-nav-item-icon" aria-hidden="true">
        {icon ? (
          <ThemeIcon
            name={icon}
            alt={iconAlt || label}
            width={20}
            height={20}
            className="primary-nav-item-icon-asset"
          />
        ) : null}
      </span>
      <span className="primary-nav-item-label">{label}</span>
    </button>
  );
}

PrimaryNavItem.propTypes = {
  icon: PropTypes.string,
  iconAlt: PropTypes.string,
  isActive: PropTypes.bool,
  label: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  title: PropTypes.string,
};

PrimaryNavItem.defaultProps = {
  icon: undefined,
  iconAlt: undefined,
  isActive: false,
  onClick: undefined,
  title: undefined,
};

function Brand({ activeView, onShowDictionary, onShowLibrary }) {
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
    if (typeof onShowLibrary === "function") {
      onShowLibrary();
    }
  };

  const navItems = [
    {
      key: "dictionary",
      label: dictionaryLabel,
      icon: "glancy-web",
      iconAlt: dictionaryLabel,
      onClick: handleDictionary,
      title: dictionaryHint,
      enableActiveState: false,
    },
    {
      key: "library",
      label: libraryLabel,
      icon: "library",
      iconAlt: libraryLabel,
      onClick: handleLibrary,
      enableActiveState: true,
      title: libraryHint,
    },
  ];

  return (
    <div className="sidebar-brand">
      <div className="sidebar-brand-header">
        <nav aria-label={dictionaryLabel}>
          <ul className="sidebar-primary-nav">
            {navItems.map((item) => {
              const isActive =
                item.enableActiveState && activeView === item.key;

              return (
                <li key={item.key}>
                  <PrimaryNavItem
                    icon={item.icon}
                    iconAlt={item.iconAlt}
                    label={item.label}
                    onClick={item.onClick}
                    isActive={isActive}
                    title={item.title}
                  />
                </li>
              );
            })}
          </ul>
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
  onShowLibrary: PropTypes.func,
};

Brand.defaultProps = {
  activeView: undefined,
  onShowDictionary: undefined,
  onShowLibrary: undefined,
};

export default Brand;
