import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon/index.tsx";

function normalizeIconProps(icon, labelText) {
  if (!icon || typeof icon.name !== "string") {
    return null;
  }

  const decorative = icon.decorative !== false;

  return {
    name: icon.name,
    width: icon.width ?? 20,
    height: icon.height ?? 20,
    decorative,
    roleClass: icon.roleClass ?? "inherit",
    alt: decorative ? "" : icon.alt ?? `${labelText} icon`,
    title: icon.title,
    className: icon.className,
    style: icon.style,
  };
}

function SectionIcon({ icon }) {
  return <ThemeIcon {...icon} />;
}

SectionIcon.propTypes = {
  icon: PropTypes.shape({
    name: PropTypes.string.isRequired,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    decorative: PropTypes.bool.isRequired,
    roleClass: PropTypes.string.isRequired,
    alt: PropTypes.string,
    title: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
  }).isRequired,
};

function SettingsNavIcon({ icon, labelText, className }) {
  const normalizedIcon = normalizeIconProps(icon, labelText);

  if (!normalizedIcon) {
    return null;
  }

  return (
    <span
      aria-hidden={normalizedIcon.decorative || undefined}
      className={className}
      data-section-icon={normalizedIcon.name}
      key={normalizedIcon.name}
    >
      <SectionIcon icon={normalizedIcon} />
    </span>
  );
}

SettingsNavIcon.propTypes = {
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
  labelText: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
};

SettingsNavIcon.defaultProps = {
  icon: null,
};

export default SettingsNavIcon;
