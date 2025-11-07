import useEmailBinding from "@shared/hooks/useEmailBinding.js";
import { useUsersApi } from "@shared/api/users.js";
import { useProfilesApi } from "@shared/api/profiles.js";
import { useRedemptionCodesApi } from "@shared/api/redemptionCodes.js";

export const usePreferenceApiClients = ({ user, setUser }) => {
  const usersApi = useUsersApi();
  const profilesApi = useProfilesApi();
  const redemptionApi = useRedemptionCodesApi();

  const emailBinding = useEmailBinding({
    user,
    onUserUpdate: setUser,
    apiClient: usersApi,
  });

  return {
    emailBinding,
    updateUsernameRequest: usersApi?.updateUsername,
    fetchProfile: profilesApi?.fetchProfile,
    saveProfile: profilesApi?.saveProfile,
    redeemCodeRequest: redemptionApi?.redeem,
  };
};
