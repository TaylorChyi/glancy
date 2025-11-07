import PropTypes from "prop-types";
import Avatar from "@shared/components/ui/Avatar";

const composeClassName = (...parts) => parts.filter(Boolean).join(" ");

function SettingsHeader({
  headingId,
  descriptionId,
  title,
  description,
  planLabel,
  avatarProps,
  classes,
}) {
  const { className: avatarClassName, ...avatarRest } = avatarProps ?? {};
  const containerClassName = classes?.container ?? "";
  const identityClassName = classes?.identity ?? "";
  const identityCopyClassName = classes?.identityCopy ?? "";
  const planClassName = classes?.plan ?? "";
  const titleClassName = classes?.title ?? "";
  const descriptionClassName = classes?.description ?? "";
  const avatarWrapperClassName = classes?.avatar ?? "";

  return (
    <header className={containerClassName}>
      <div className={identityClassName}>
        <Avatar
          {...avatarRest}
          className={composeClassName(avatarWrapperClassName, avatarClassName)}
        />
        <div className={identityCopyClassName}>
          {planLabel ? <p className={planClassName}>{planLabel}</p> : null}
          <h2 id={headingId} className={titleClassName}>
            {title}
          </h2>
        </div>
      </div>
      {description ? (
        <p id={descriptionId} className={descriptionClassName}>
          {description}
        </p>
      ) : null}
    </header>
  );
}

SettingsHeader.propTypes = {
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  planLabel: PropTypes.string,
  avatarProps: PropTypes.shape({
    className: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  classes: PropTypes.shape({
    container: PropTypes.string,
    identity: PropTypes.string,
    identityCopy: PropTypes.string,
    avatar: PropTypes.string,
    plan: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
  }),
};

SettingsHeader.defaultProps = {
  descriptionId: undefined,
  description: "",
  planLabel: "",
  avatarProps: undefined,
  classes: undefined,
};

export default SettingsHeader;
