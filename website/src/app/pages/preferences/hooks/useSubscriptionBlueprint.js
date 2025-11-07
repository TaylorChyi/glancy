import { useMemo } from "react";
import { buildSubscriptionSectionProps } from "../sections/subscriptionBlueprint.js";

export const useSubscriptionBlueprint = ({
  translations,
  user,
  handleRedeem,
}) =>
  useMemo(
    () =>
      buildSubscriptionSectionProps({
        translations,
        user,
        onRedeem: handleRedeem,
      }),
    [handleRedeem, translations, user],
  );
