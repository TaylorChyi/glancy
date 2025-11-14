import { memo } from "react";
import AvatarEditorModal from "@shared/components/AvatarEditorModal";
import { avatarEditorPropTypes } from "./ProfileView.propTypes.js";

const ProfileAvatarEditor = memo(function ProfileAvatarEditor({ controller }) {
  return (
    <AvatarEditorModal
      open={controller.editor.phase !== "idle"}
      source={controller.editor.source}
      onCancel={controller.handleAvatarModalClose}
      onConfirm={controller.handleAvatarConfirm}
      labels={controller.labels}
      isProcessing={controller.editor.phase === "uploading"}
    />
  );
});

ProfileAvatarEditor.propTypes = avatarEditorPropTypes;

export default ProfileAvatarEditor;
