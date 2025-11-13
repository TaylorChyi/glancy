import PropTypes from "prop-types";
import { useLanguage } from "@core/context";
import { useMediaQuery } from "@shared/hooks";
import SettingsNavButton from "./SettingsNavButton.jsx";
import { useSettingsNavCloseAction } from "./hooks/useSettingsNavCloseAction";
import { formatSectionLabel } from "./formatSectionLabel.js";

const HORIZONTAL_NAV_BREAKPOINT = 768;
const HORIZONTAL_NAV_QUERY = `(max-width: ${HORIZONTAL_NAV_BREAKPOINT}px)`;

const resolveClasses = (classes) => ({
  container: classes?.container ?? "",
  action: classes?.action ?? "",
  nav: classes?.nav ?? "",
  button: classes?.button ?? "",
  label: classes?.label ?? "",
  labelText: classes?.labelText ?? "",
  icon: classes?.icon ?? "",
  actionButton: classes?.actionButton ?? "",
});

function SettingsNav({
  sections,
  activeSectionId,
  onSelect,
  tablistLabel,
  renderCloseAction,
  classes,
}) {
  const { lang } = useLanguage();
  const sectionCount = sections.length;
  const isHorizontalLayout = useMediaQuery(HORIZONTAL_NAV_QUERY);
  const navOrientation = isHorizontalLayout ? "horizontal" : "vertical";
  const resolvedClasses = resolveClasses(classes);
  const closeActionNode = useSettingsNavCloseAction(
    renderCloseAction,
    resolvedClasses.actionButton,
  );

  return (
    <div
      className={resolvedClasses.container}
      data-orientation={navOrientation}
      data-compact={isHorizontalLayout || undefined}
    >
      <nav
        aria-label={tablistLabel}
        aria-orientation={navOrientation}
        className={resolvedClasses.nav}
        role="tablist"
        style={{ "--settings-nav-section-count": sectionCount }}
        data-orientation={navOrientation}
      >
        {closeActionNode ? (
          <div role="presentation" className={resolvedClasses.action}>
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
              button: resolvedClasses.button,
              label: resolvedClasses.label,
              labelText: resolvedClasses.labelText,
              icon: resolvedClasses.icon,
            }}
          />
        ))}
      </nav>
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
