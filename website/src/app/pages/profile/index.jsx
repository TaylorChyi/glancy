import ProfileLayout from "./ProfileLayout.jsx";
import { useProfilePageModel } from "./useProfilePageModel.js";

function Profile({ onCancel }) {
  const {
    t,
    currentUser,
    popup,
    detailsState,
    phoneState,
    avatarController,
    emailBinding,
    emailWorkflow,
    isSaving,
    handleSave,
    usernameHandlers,
  } = useProfilePageModel();

  return (
    <ProfileLayout
      t={t}
      currentUser={currentUser}
      popup={popup}
      detailsState={detailsState}
      phoneState={phoneState}
      avatarController={avatarController}
      emailBinding={emailBinding}
      emailWorkflow={emailWorkflow}
      isSaving={isSaving}
      handleSave={handleSave}
      onCancel={onCancel}
      usernameHandlers={usernameHandlers}
    />
  );
}

export default Profile;
