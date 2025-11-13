import PropTypes from "prop-types";
import Avatar from "@shared/components/ui/Avatar";

const composeClassName = (...parts) => parts.filter(Boolean).join(" ");

const resolveClasses = (classes = {}) => ({
  container: classes.container ?? "",
  identity: classes.identity ?? "",
  identityCopy: classes.identityCopy ?? "",
  avatar: classes.avatar ?? "",
  plan: classes.plan ?? "",
  title: classes.title ?? "",
  description: classes.description ?? "",
});

const renderPlanLabel = (planLabel, planClassName) =>
  planLabel ? <p className={planClassName}>{planLabel}</p> : null;

const renderDescription = (description, descriptionId, descriptionClassName) =>
  description ? (
    <p id={descriptionId} className={descriptionClassName}>
      {description}
    </p>
  ) : null;

function SettingsHeader({
  headingId,
  descriptionId,
  title,
  description,
  planLabel,
  avatarProps,
  classes,
}) {
  const resolvedClasses = resolveClasses(classes);
  const { className: avatarClassName, ...avatarRest } = avatarProps ?? {};
  const avatarClass = composeClassName(
    resolvedClasses.avatar,
    avatarClassName,
  );

  return (
    <header className={resolvedClasses.container}>
      <div className={resolvedClasses.identity}>
        <Avatar {...avatarRest} className={avatarClass} />
        <div className={resolvedClasses.identityCopy}>
          {renderPlanLabel(planLabel, resolvedClasses.plan)}
          <h2 id={headingId} className={resolvedClasses.title}>
            {title}
          </h2>
        </div>
      </div>
      {renderDescription(description, descriptionId, resolvedClasses.description)}
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
