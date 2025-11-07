export const createPreferenceViewModel = ({
  preferenceCopy,
  sections,
  navigation,
  panel,
  avatarEditorModalProps,
  redeemToast,
}) => ({
  copy: preferenceCopy.copy,
  header: preferenceCopy.header,
  sections,
  activeSection: navigation.activeSection,
  activeSectionId: navigation.activeSectionId,
  handleSectionSelect: navigation.handleSectionSelect,
  handleSubmit: navigation.handleSubmit,
  panel,
  avatarEditor: { modalProps: avatarEditorModalProps },
  feedback: { redeemToast },
});
