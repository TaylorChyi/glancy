import PropTypes from "prop-types";

import { formatSectionLabel } from "./formatSectionLabel.js";
import SettingsNavButton from "./SettingsNavButton.jsx";

function SettingsNavList({
  sections,
  activeSectionId,
  onSelect,
  tablistLabel,
  orientation,
  sectionCount,
  isHorizontalLayout,
  lang,
  classNames,
  closeActionNode,
}) {
  return (
    <nav
      aria-label={tablistLabel}
      aria-orientation={orientation}
      className={classNames.nav}
      role="tablist"
      style={{ "--settings-nav-section-count": sectionCount }}
      data-orientation={orientation}
    >
      {closeActionNode ? (
        <div role="presentation" className={classNames.action}>
          {closeActionNode}
        </div>
      ) : null}
      {sections.map((section) => (
        <SettingsNavButton
          key={section.id}
          section={section}
          isActive={section.id === activeSectionId}
          formattedLabel={formatSectionLabel(section.label, lang)}
          onSelect={onSelect}
          isHorizontalLayout={isHorizontalLayout}
          classNames={{
            button: classNames.button,
            label: classNames.label,
            labelText: classNames.labelText,
            icon: classNames.icon,
          }}
        />
      ))}
    </nav>
  );
}

SettingsNavList.propTypes = {
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
  orientation: PropTypes.oneOf(["horizontal", "vertical"]).isRequired,
  sectionCount: PropTypes.number.isRequired,
  isHorizontalLayout: PropTypes.bool.isRequired,
  lang: PropTypes.string.isRequired,
  classNames: PropTypes.shape({
    nav: PropTypes.string.isRequired,
    action: PropTypes.string.isRequired,
    button: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    labelText: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
  }).isRequired,
  closeActionNode: PropTypes.node,
};

SettingsNavList.defaultProps = {
  activeSectionId: "",
  closeActionNode: null,
};

export default SettingsNavList;
