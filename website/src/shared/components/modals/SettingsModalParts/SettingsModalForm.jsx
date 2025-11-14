import PropTypes from "prop-types";
import ActiveSectionRenderer from "./ActiveSectionRenderer.jsx";
import FallbackHeading from "./FallbackHeading.jsx";
import modalStyles from "../SettingsModal.module.css";

const createFallbackHeadingNode = ({
  shouldRenderFallbackHeading,
  fallbackHeadingId,
  fallbackHeadingText,
  registerFallbackHeading,
}) => (
  <FallbackHeading
    shouldRender={shouldRenderFallbackHeading}
    id={fallbackHeadingId}
    text={fallbackHeadingText}
    register={registerFallbackHeading}
  />
);

const createActiveSectionNode = ({
  activeSection,
  sectionHeadingId,
  sectionDescriptionId,
}) => (
  <ActiveSectionRenderer
    activeSection={activeSection}
    headingId={sectionHeadingId}
    descriptionId={sectionDescriptionId}
  />
);

function SettingsModalForm({
  ariaHeadingId,
  ariaDescriptionId,
  sectionHeadingId,
  sectionDescriptionId,
  onSubmit,
  shouldRenderFallbackHeading,
  fallbackHeadingId,
  fallbackHeadingText,
  registerFallbackHeading,
  activeSection,
}) {
  const fallbackHeadingNode = createFallbackHeadingNode({
    shouldRenderFallbackHeading,
    fallbackHeadingId,
    fallbackHeadingText,
    registerFallbackHeading,
  });
  const activeSectionNode = createActiveSectionNode({
    activeSection,
    sectionHeadingId,
    sectionDescriptionId,
  });

  return (
    <form
      aria-labelledby={ariaHeadingId}
      aria-describedby={ariaDescriptionId}
      className={modalStyles.form}
      onSubmit={onSubmit}
    >
      {fallbackHeadingNode}
      {activeSectionNode}
    </form>
  );
}

SettingsModalForm.propTypes = {
  ariaHeadingId: PropTypes.string.isRequired,
  ariaDescriptionId: PropTypes.string.isRequired,
  sectionHeadingId: PropTypes.string.isRequired,
  sectionDescriptionId: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  shouldRenderFallbackHeading: PropTypes.bool.isRequired,
  fallbackHeadingId: PropTypes.string,
  fallbackHeadingText: PropTypes.string,
  registerFallbackHeading: PropTypes.func,
  activeSection: PropTypes.shape({
    Component: PropTypes.elementType.isRequired,
    componentProps: PropTypes.shape({}),
  }),
};

SettingsModalForm.defaultProps = {
  sectionDescriptionId: undefined,
  fallbackHeadingId: undefined,
  fallbackHeadingText: undefined,
  registerFallbackHeading: undefined,
  activeSection: undefined,
};

export default SettingsModalForm;
