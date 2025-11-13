import { useMemo } from "react";

import { createSubscriptionSectionViewModel } from "./viewModel";

const pickStaticProps = (props) => ({
  title: props.title,
  headingId: props.headingId,
  descriptionId: props.descriptionId,
  planCards: props.planCards,
  featureMatrix: props.featureMatrix,
  visiblePlanIds: props.visiblePlanIds,
  planLabels: props.planLabels,
  pricingNote: props.pricingNote,
  taxNote: props.taxNote,
  redeemCopy: props.redeemCopy,
  defaultSelectedPlanId: props.defaultSelectedPlanId,
  featureColumnLabel: props.featureColumnLabel,
});

const useStaticSubscriptionProps = (baseProps) =>
  useMemo(() => pickStaticProps(baseProps), [baseProps]);

const useDynamicSubscriptionProps = ({
  selectedPlanId,
  formattedRedeemCode,
  planRailNav,
  handlers,
  redeemInputRef,
}) =>
  useMemo(
    () => ({
      selectedPlanId,
      formattedRedeemCode,
      planRailNav,
      handlers,
      redeemRefs: { inputRef: redeemInputRef },
    }),
    [formattedRedeemCode, handlers, planRailNav, redeemInputRef, selectedPlanId],
  );

export const useSubscriptionSectionViewModel = ({
  baseProps,
  selectedPlanId,
  formattedRedeemCode,
  planRailNav,
  handlers,
  redeemInputRef,
}) => {
  const staticProps = useStaticSubscriptionProps(baseProps);
  const dynamicProps = useDynamicSubscriptionProps({
    selectedPlanId,
    formattedRedeemCode,
    planRailNav,
    handlers,
    redeemInputRef,
  });

  const viewModelArgs = useMemo(
    () => ({ ...staticProps, ...dynamicProps }),
    [dynamicProps, staticProps],
  );

  return useMemo(
    () => createSubscriptionSectionViewModel(viewModelArgs),
    [viewModelArgs],
  );
};
