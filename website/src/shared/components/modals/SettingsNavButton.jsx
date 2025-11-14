import PropTypes from "prop-types";
import SettingsNavIcon from "./SettingsNavIcon.jsx";

const isSectionDisabled = (section) => Boolean(section.disabled);

const createClickHandler = (section, onSelect) => () => {
  if (!isSectionDisabled(section)) {
    onSelect(section);
  }
};

function SettingsNavButtonLabel({
  icon,
  formattedLabel,
  hideLabelText,
  classNames,
}) {
  return (
    <span className={classNames.label}>
      <SettingsNavIcon
        icon={icon}
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
  );
}

SettingsNavButtonLabel.propTypes = {
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
  formattedLabel: PropTypes.string.isRequired,
  hideLabelText: PropTypes.bool.isRequired,
  classNames: PropTypes.shape({
    label: PropTypes.string.isRequired,
    labelText: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
  }).isRequired,
};

SettingsNavButtonLabel.defaultProps = {
  icon: undefined,
};

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
  const disabled = isSectionDisabled(section);
  const handleClick = createClickHandler(section, onSelect);
  const labelNode = (
    <SettingsNavButtonLabel
      icon={section.icon}
      formattedLabel={formattedLabel}
      hideLabelText={hideLabelText}
      classNames={{
        label: classNames.label,
        labelText: classNames.labelText,
        icon: classNames.icon,
      }}
    />
  );

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-controls={panelId}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      className={classNames.button}
      data-state={isActive ? "active" : "inactive"}
      aria-label={hideLabelText ? formattedLabel : undefined}
      onClick={handleClick}
    >
      {labelNode}
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
