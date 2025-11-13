import { usePreferenceCopyService } from "./utils/usePreferenceCopyService.js";
import { useResponseStyleResources } from "./utils/useResponseStyleResources.js";
import { useSubscriptionServices } from "./utils/useSubscriptionServices.js";
import { usePreferenceApiResources } from "./utils/usePreferenceApiResources.js";

export const usePreferenceDomainServices = ({ translations, user, setUser }) => {
  const apiResources = usePreferenceApiResources({ user, setUser });

  const preferenceCopy = usePreferenceCopyService({ translations, user });

  const { subscriptionSection, redeemToast } = useSubscriptionServices({
    translations,
    user,
    setUser,
    redeemCodeRequest: apiResources.redeemCodeRequest,
  });

  const { responseStyleCopy, responseStylePreferences } =
    useResponseStyleResources({
      translations,
      user,
      fetchProfile: apiResources.fetchProfile,
      saveProfile: apiResources.saveProfile,
    });

  return {
    preferenceCopy,
    responseStyleCopy,
    responseStylePreferences,
    subscriptionSection,
    redeemToast,
    emailBinding: apiResources.emailBinding,
    updateUsernameRequest: apiResources.updateUsernameRequest,
  };
};
