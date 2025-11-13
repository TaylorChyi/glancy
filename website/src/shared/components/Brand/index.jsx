import { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { useLanguage } from "@core/context";
import { UserMenu } from "@shared/components/Header";
import ThemeIcon from "@shared/components/ui/Icon";
import { getBrandText, BRAND_LOGO_ICON } from "@shared/utils";

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
            
            roleClass="inherit"
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

function useBrandNavItems({ t, brandText, onShowDictionary, onShowLibrary }) {
  const dictionaryLabel = t.primaryNavDictionaryLabel || brandText;
  const libraryLabel = t.primaryNavLibraryLabel || t.favorites || "Favorites";
  const entriesLabel = t.primaryNavEntriesLabel || t.termLabel || "Entries";
  const dictionaryHint =
    t.primaryNavDictionaryDescription || t.searchTitle || dictionaryLabel;
  const libraryHint =
    t.primaryNavLibraryDescription || t.favoritesEmptyTitle || libraryLabel;

  const handleDictionary = useCallback(() => {
    if (typeof onShowDictionary === "function") {
      onShowDictionary();
      return;
    }
    window.location.reload();
  }, [onShowDictionary]);

  const handleLibrary = useCallback(() => {
    if (typeof onShowLibrary === "function") {
      onShowLibrary();
    }
  }, [onShowLibrary]);

  const navItems = useMemo(
    () => [
      {
        key: "dictionary",
        label: dictionaryLabel,
        icon: BRAND_LOGO_ICON,
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
    ],
    [
      dictionaryHint,
      dictionaryLabel,
      handleDictionary,
      handleLibrary,
      libraryHint,
      libraryLabel,
    ],
  );

  return {
    dictionaryLabel,
    entriesLabel,
    navItems,
  };
}

function PrimaryNavList({ navItems, activeView, ariaLabel }) {
  return (
    <nav aria-label={ariaLabel}>
      <ul className="sidebar-primary-nav">
        {navItems.map((item) => {
          const isActive = item.enableActiveState && activeView === item.key;

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
  );
}

PrimaryNavList.propTypes = {
  activeView: PropTypes.string,
  ariaLabel: PropTypes.string.isRequired,
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      enableActiveState: PropTypes.bool.isRequired,
      icon: PropTypes.string,
      iconAlt: PropTypes.string,
      key: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
      onClick: PropTypes.func,
      title: PropTypes.string,
    }).isRequired,
  ).isRequired,
};

PrimaryNavList.defaultProps = {
  activeView: undefined,
};

function Brand({ activeView, onShowDictionary, onShowLibrary }) {
  const { lang, t } = useLanguage();
  const brandText = getBrandText(lang);

  const { dictionaryLabel, entriesLabel, navItems } = useBrandNavItems({
    t,
    brandText,
    onShowDictionary,
    onShowLibrary,
  });

  return (
    <div className="sidebar-brand">
      <div className="sidebar-brand-header">
        <PrimaryNavList
          navItems={navItems}
          activeView={activeView}
          ariaLabel={dictionaryLabel}
        />
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
