const buildFormProps = ({
  t,
  avatarController,
  currentUser,
  usernameHandlers,
  emailBinding,
  emailWorkflow,
  phoneState,
  detailsState,
  isSaving,
  onCancel,
  handleSave,
}) => ({
  t,
  avatarController,
  currentUser,
  usernameHandlers,
  emailBinding,
  emailWorkflow,
  phoneState,
  detailsState,
  isSaving,
  onCancel,
  handleSave,
});

const buildLayoutProps = ({ t, popup }) => ({
  title: t.profileTitle,
  popup: popup.popupConfig,
});

const buildAvatarEditorProps = ({ avatarController }) => ({
  controller: avatarController,
});

export const useProfileViewComposition = (viewProps) => {
  const formProps = buildFormProps(viewProps);
  const layoutProps = buildLayoutProps(viewProps);
  const avatarEditorProps = buildAvatarEditorProps(viewProps);
  return { formProps, layoutProps, avatarEditorProps };
};
