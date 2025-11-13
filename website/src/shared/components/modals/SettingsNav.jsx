import PropTypes from "prop-types";
import { useLanguage } from "@core/context";
import { useSettingsNavCloseAction } from "./hooks/useSettingsNavCloseAction";
import SettingsNavList from "./SettingsNavList.jsx";
import { useSettingsNavClasses } from "./hooks/useSettingsNavClasses";
import { useSettingsNavOrientation } from "./hooks/useSettingsNavOrientation";

function SettingsNav({
  sections,
  activeSectionId,
  onSelect,
  tablistLabel,
  renderCloseAction,
  classes,
}) {
  const { lang } = useLanguage();
  const { orientation, isHorizontalLayout } = useSettingsNavOrientation();
  const resolvedClasses = useSettingsNavClasses(classes);
  const closeActionNode = useSettingsNavCloseAction(
    renderCloseAction,
    resolvedClasses.actionButton,
  );

  return (
    <div
      className={resolvedClasses.container}
      data-orientation={orientation}
      data-compact={isHorizontalLayout || undefined}
    >
      <SettingsNavList
        sections={sections}
        activeSectionId={activeSectionId}
        onSelect={onSelect}
        tablistLabel={tablistLabel}
        orientation={orientation}
        sectionCount={sections.length}
        isHorizontalLayout={isHorizontalLayout}
        lang={lang}
        classNames={resolvedClasses}
        closeActionNode={closeActionNode}
      />
    </div>
  );
}

SettingsNav.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
      icon: PropTypes.shape({
        name: PropTypes.string.isRequired,
        width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        decorative: PropTypes.bool,
        roleClass: PropTypes.string,
        alt: PropTypes.string,
        title: PropTypes.string,
        className: PropTypes.string,
        style: PropTypes.object,
      }),
    }).isRequired,
  ).isRequired,
  activeSectionId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  tablistLabel: PropTypes.string.isRequired,
  renderCloseAction: PropTypes.func,
  classes: PropTypes.shape({
    container: PropTypes.string,
    action: PropTypes.string,
    nav: PropTypes.string,
    button: PropTypes.string,
    label: PropTypes.string,
    labelText: PropTypes.string,
    icon: PropTypes.string,
    actionButton: PropTypes.string,
  }),
};

SettingsNav.defaultProps = {
  activeSectionId: "",
  renderCloseAction: undefined,
  classes: undefined,
};

export default SettingsNav;
