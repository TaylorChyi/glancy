import { useRedeemSubscription } from "../useRedeemSubscription.js";
import { useSubscriptionBlueprint } from "../useSubscriptionBlueprint.js";

export const useSubscriptionServices = ({
  translations,
  user,
  setUser,
  redeemCodeRequest,
}) => {
  const { redeemToast, handleRedeem } = useRedeemSubscription({
    translations,
    user,
    setUser,
    redeemCodeRequest,
  });

  const subscriptionSection = useSubscriptionBlueprint({
    translations,
    user,
    handleRedeem,
  });

  return { subscriptionSection, redeemToast };
};
