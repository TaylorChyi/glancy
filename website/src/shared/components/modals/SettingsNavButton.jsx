import PropTypes from "prop-types";
import SettingsNavIcon from "./SettingsNavIcon.jsx";

function SettingsNavButton({
  section,
  isActive,
  formattedLabel,
  onSelect,
  isHorizontalLayout,
  classNames,
}) {
  const tabId = `${section.id}-tab`;
  const panelId = `${section.id}-panel`;
  const hideLabelText = isHorizontalLayout && Boolean(section.icon?.name);

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-controls={panelId}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      disabled={section.disabled}
      className={classNames.button}
      data-state={isActive ? "active" : "inactive"}
      aria-label={hideLabelText ? formattedLabel : undefined}
      onClick={() => {
        if (!section.disabled) {
          onSelect(section);
        }
      }}
    >
      <span className={classNames.label}>
        <SettingsNavIcon
          icon={section.icon}
          labelText={formattedLabel}
          className={classNames.icon}
        />
        <span
          className={classNames.labelText}
          data-element="label-text"
          aria-hidden={hideLabelText || undefined}
        >
          {formattedLabel}
        </span>
      </span>
    </button>
  );
}

SettingsNavButton.propTypes = {
  section: PropTypes.shape({
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
  isActive: PropTypes.bool.isRequired,
  formattedLabel: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  isHorizontalLayout: PropTypes.bool.isRequired,
  classNames: PropTypes.shape({
    button: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    labelText: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
  }).isRequired,
};

export default SettingsNavButton;
