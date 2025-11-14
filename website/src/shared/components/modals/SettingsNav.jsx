import PropTypes from "prop-types";
import SettingsNavList from "./SettingsNavList.jsx";
import { useSettingsNavContext } from "./hooks/useSettingsNavContext";

function SettingsNav({
  sections,
  activeSectionId,
  onSelect,
  tablistLabel,
  renderCloseAction,
  classes,
}) {
  const settingsNavContext = useSettingsNavContext({
    classes,
    renderCloseAction,
  });

  const navListProps = {
    sections,
    activeSectionId,
    onSelect,
    tablistLabel,
    orientation: settingsNavContext.orientation,
    sectionCount: sections.length,
    isHorizontalLayout: settingsNavContext.isHorizontalLayout,
    lang: settingsNavContext.lang,
    classNames: settingsNavContext.classNames,
    closeActionNode: settingsNavContext.closeActionNode,
  };

  return (
    <div
      className={settingsNavContext.classNames.container}
      data-orientation={settingsNavContext.orientation}
      data-compact={
        settingsNavContext.isHorizontalLayout || undefined
      }
    >
      <SettingsNavList {...navListProps} />
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
