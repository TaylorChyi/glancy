import { useMemo } from "react";

import { createSubscriptionSectionViewModel } from "./viewModel";

export const useSubscriptionSectionViewModel = ({
  baseProps,
  selectedPlanId,
  formattedRedeemCode,
  planRailNav,
  handlers,
  redeemInputRef,
}) => {
  const {
    title,
    headingId,
    descriptionId,
    planCards,
    featureMatrix,
    visiblePlanIds,
    planLabels,
    pricingNote,
    taxNote,
    redeemCopy,
    defaultSelectedPlanId,
    featureColumnLabel,
  } = baseProps;

  return useMemo(
    () =>
      createSubscriptionSectionViewModel({
        title,
        headingId,
        descriptionId,
        planCards,
        featureMatrix,
        visiblePlanIds,
        planLabels,
        pricingNote,
        taxNote,
        redeemCopy,
        defaultSelectedPlanId,
        selectedPlanId,
        formattedRedeemCode,
        planRailNav,
        handlers,
        redeemRefs: { inputRef: redeemInputRef },
        featureColumnLabel,
      }),
    [
      defaultSelectedPlanId,
      descriptionId,
      featureColumnLabel,
      featureMatrix,
      formattedRedeemCode,
      handlers,
      headingId,
      planCards,
      planLabels,
      planRailNav,
      pricingNote,
      redeemCopy,
      redeemInputRef,
      selectedPlanId,
      taxNote,
      title,
      visiblePlanIds,
    ],
  );
};
