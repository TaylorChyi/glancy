import { useMemo } from "react";
import { usePreferenceCopy } from "./usePreferenceCopy.js";
import { useRedeemSubscription } from "./useRedeemSubscription.js";
import { useResponseStylePreferences } from "./useResponseStylePreferences.js";
import { createResponseStyleCopy } from "./createResponseStyleCopy.js";
import { useSubscriptionBlueprint } from "./useSubscriptionBlueprint.js";
import { usePreferenceApiClients } from "./usePreferenceApiClients.js";

export const usePreferenceDomainServices = ({
  translations,
  user,
  setUser,
}) => {
  const {
    emailBinding,
    updateUsernameRequest,
    fetchProfile,
    saveProfile,
    redeemCodeRequest,
  } = usePreferenceApiClients({ user, setUser });

  const preferenceCopy = usePreferenceCopy({ translations, user });
  const { redeemToast, handleRedeem } = useRedeemSubscription({
    translations,
    user,
    setUser,
    redeemCodeRequest,
  });
  const responseStyleCopy = useMemo(
    () => createResponseStyleCopy(translations),
    [translations],
  );
  const responseStylePreferences = useResponseStylePreferences({
    user,
    fetchProfile,
    saveProfile,
  });
  const subscriptionSection = useSubscriptionBlueprint({
    translations,
    user,
    handleRedeem,
  });

  return {
    preferenceCopy,
    responseStyleCopy,
    responseStylePreferences,
    subscriptionSection,
    redeemToast,
    emailBinding,
    updateUsernameRequest,
  };
};
