import PropTypes from "prop-types";
import BaseModal from "./BaseModal.jsx";
import AvatarEditorModal from "@shared/components/AvatarEditorModal";
import SettingsSectionsViewport from "@shared/components/settings/SettingsSectionsViewport";
import SettingsModalForm from "./SettingsModalParts/SettingsModalForm.jsx";
import RedeemToast from "./SettingsModalParts/RedeemToast.jsx";
import CloseActionButton from "./SettingsModalParts/CloseActionButton.jsx";

const createCloseRenderer = (closeAction) =>
  closeAction
    ? ({ className = "" } = {}) => (
        <CloseActionButton
          className={className}
          label={closeAction.label}
          onClose={closeAction.onClose}
        />
      )
    : undefined;

function SettingsModalView({ modal, viewport, form, avatarEditor, toast, closeAction }) {
  const renderCloseAction = createCloseRenderer(closeAction);
  return (
    <>
      <BaseModal {...modal}>
        <SettingsSectionsViewport
          {...viewport}
          renderCloseAction={renderCloseAction}
        >
          <SettingsModalForm {...form} />
        </SettingsSectionsViewport>
        {avatarEditor ? <AvatarEditorModal {...avatarEditor} /> : null}
      </BaseModal>
      <RedeemToast toast={toast} />
    </>
  );
}

SettingsModalView.propTypes = {
  modal: PropTypes.shape({
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    className: PropTypes.string.isRequired,
    closeLabel: PropTypes.string.isRequired,
    hideDefaultCloseButton: PropTypes.bool,
    ariaLabelledBy: PropTypes.string,
    ariaDescribedBy: PropTypes.string,
  }).isRequired,
  viewport: PropTypes.shape({
    sections: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired })).isRequired,
    activeSectionId: PropTypes.string.isRequired,
    onSectionSelect: PropTypes.func.isRequired,
    tablistLabel: PropTypes.string.isRequired,
    referenceSectionId: PropTypes.string,
    body: PropTypes.shape({}),
    nav: PropTypes.shape({}),
    panel: PropTypes.shape({}).isRequired,
    onHeadingElementChange: PropTypes.func,
  }).isRequired,
  form: PropTypes.shape({
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
  }).isRequired,
  avatarEditor: PropTypes.shape({}),
  toast: PropTypes.shape({}),
  closeAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
  }),
};

SettingsModalView.defaultProps = {
  avatarEditor: undefined,
  toast: undefined,
  closeAction: undefined,
};

export default SettingsModalView;
