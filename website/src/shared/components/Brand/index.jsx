import PropTypes from "prop-types";
import { useLanguage } from "@core/context";
import { UserMenu } from "@shared/components/Header";
import { getBrandText } from "@shared/utils";
import PrimaryNavList from "./PrimaryNavList";
import useBrandNavItems from "./useBrandNavItems";

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
