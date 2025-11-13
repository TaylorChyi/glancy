import PropTypes from "prop-types";

const avatarLabelsShape = PropTypes.shape({
  title: PropTypes.string,
  description: PropTypes.string,
  zoomIn: PropTypes.string,
  zoomOut: PropTypes.string,
  cancel: PropTypes.string,
  confirm: PropTypes.string,
});

const avatarEditorShape = PropTypes.shape({
  phase: PropTypes.string.isRequired,
  source: PropTypes.string,
});

const avatarControllerShape = PropTypes.shape({
  avatar: PropTypes.string,
  editor: avatarEditorShape.isRequired,
  labels: avatarLabelsShape,
  handleAvatarChange: PropTypes.func.isRequired,
  handleAvatarModalClose: PropTypes.func.isRequired,
  handleAvatarConfirm: PropTypes.func.isRequired,
});

const usernameHandlersShape = PropTypes.shape({
  onSubmit: PropTypes.func.isRequired,
  onFailure: PropTypes.func.isRequired,
});

const emailBindingShape = PropTypes.shape({
  mode: PropTypes.string,
  isSendingCode: PropTypes.bool,
  isVerifying: PropTypes.bool,
  isUnbinding: PropTypes.bool,
  isAwaitingVerification: PropTypes.bool,
  requestedEmail: PropTypes.string,
  startEditing: PropTypes.func.isRequired,
  cancelEditing: PropTypes.func.isRequired,
});

const emailWorkflowShape = PropTypes.shape({
  requestCode: PropTypes.func.isRequired,
  confirmChange: PropTypes.func.isRequired,
  unbind: PropTypes.func.isRequired,
});

const fieldShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  icon: PropTypes.string,
  label: PropTypes.string,
  help: PropTypes.string,
  placeholder: PropTypes.string,
});

const fieldGroupShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(fieldShape).isRequired,
});

const detailsStateShape = PropTypes.shape({
  fieldGroups: PropTypes.arrayOf(fieldGroupShape).isRequired,
  details: PropTypes.shape({
    customSections: PropTypes.arrayOf(PropTypes.shape({})),
  }).isRequired,
  handleFieldChange: PropTypes.func.isRequired,
  handleCustomSectionsChange: PropTypes.func.isRequired,
});

const phoneStateShape = PropTypes.shape({
  phone: PropTypes.string,
  setPhone: PropTypes.func.isRequired,
});

const translationShape = PropTypes.shape({
  profileTitle: PropTypes.string,
  avatarHint: PropTypes.string,
  phonePlaceholder: PropTypes.string,
  editButton: PropTypes.string,
  saveButton: PropTypes.string,
  cancelButton: PropTypes.string,
});

const popupConfigShape = PropTypes.shape({
  open: PropTypes.bool.isRequired,
  message: PropTypes.string,
  onClose: PropTypes.func.isRequired,
});

export const profileFormPropTypes = {
  t: translationShape.isRequired,
  avatarController: avatarControllerShape.isRequired,
  currentUser: PropTypes.shape({
    username: PropTypes.string,
    email: PropTypes.string,
  }),
  usernameHandlers: usernameHandlersShape.isRequired,
  emailBinding: emailBindingShape.isRequired,
  emailWorkflow: emailWorkflowShape.isRequired,
  phoneState: phoneStateShape.isRequired,
  detailsState: detailsStateShape.isRequired,
  isSaving: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  handleSave: PropTypes.func.isRequired,
};

export const profileFormDefaultProps = {
  currentUser: undefined,
};

export const avatarEditorPropTypes = {
  controller: avatarControllerShape.isRequired,
};

export const profilePageLayoutPropTypes = {
  title: PropTypes.string,
  popup: popupConfigShape,
  children: PropTypes.node.isRequired,
};

export const profilePageLayoutDefaultProps = {
  title: "",
  popup: undefined,
};

export const profileViewPropTypes = {
  t: translationShape.isRequired,
  avatarController: avatarControllerShape.isRequired,
  emailBinding: emailBindingShape.isRequired,
  emailWorkflow: emailWorkflowShape.isRequired,
  phoneState: phoneStateShape.isRequired,
  detailsState: detailsStateShape.isRequired,
  isSaving: PropTypes.bool.isRequired,
  handleSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  popup: PropTypes.shape({
    popupConfig: popupConfigShape.isRequired,
  }).isRequired,
  currentUser: PropTypes.shape({
    username: PropTypes.string,
    email: PropTypes.string,
  }),
  usernameHandlers: usernameHandlersShape.isRequired,
};

export const profileViewDefaultProps = {
  currentUser: undefined,
};
