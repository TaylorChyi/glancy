import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon/index.tsx";

function SettingsNavIcon({ icon, labelText, className }) {
  if (!icon || typeof icon.name !== "string") {
    return null;
  }
  const width = icon.width ?? 20;
  const height = icon.height ?? 20;
  const decorative = icon.decorative !== false;
  const roleClass = icon.roleClass ?? "inherit";
  const title = icon.title;
  const altText = decorative ? "" : icon.alt ?? `${labelText} icon`;

  return (
    <span
      aria-hidden={decorative || undefined}
      className={className}
      data-section-icon={icon.name}
      key={icon.name}
    >
      <ThemeIcon
        name={icon.name}
        width={width}
        height={height}
        decorative={decorative}
        roleClass={roleClass}
        alt={altText}
        title={title}
        className={icon.className}
        style={icon.style}
      />
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
