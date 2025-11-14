import PropTypes from "prop-types";
import ActiveSectionRenderer from "./ActiveSectionRenderer.jsx";
import FallbackHeading from "./FallbackHeading.jsx";
import modalStyles from "../SettingsModal.module.css";

const SettingsModalForm = ({
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
}) => (
  <form
    aria-labelledby={ariaHeadingId}
    aria-describedby={ariaDescriptionId}
    className={modalStyles.form}
    onSubmit={onSubmit}
  >
    <FallbackHeading shouldRender={shouldRenderFallbackHeading} id={fallbackHeadingId} text={fallbackHeadingText} register={registerFallbackHeading} />
    <ActiveSectionRenderer activeSection={activeSection} headingId={sectionHeadingId} descriptionId={sectionDescriptionId} />
  </form>
);

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
