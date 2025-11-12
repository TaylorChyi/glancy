import ProfileView from "./ProfileView.jsx";
import { useProfileFormController } from "./useProfileFormController.js";

function Profile({ onCancel }) {
  const viewModel = useProfileFormController({ onCancel });

  return <ProfileView {...viewModel} />;
}

export default Profile;
