import { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";

import SubscriptionSectionView from "./SubscriptionSection/SubscriptionSectionView.jsx";
import { useRedeemCodeField } from "./SubscriptionSection/useRedeemCodeField.js";
import { usePlanCarouselNavigation } from "./SubscriptionSection/usePlanCarouselNavigation.js";
import { useSubscriptionSectionViewModel } from "./SubscriptionSection/useSubscriptionSectionViewModel.js";

function usePlanSelection(defaultSelectedPlanId) {
  const [selectedPlanId, setSelectedPlanId] = useState(defaultSelectedPlanId);

  const handlePlanSelect = useCallback((planId, disabled) => {
    if (disabled) {
      return;
    }
    setSelectedPlanId(planId);
  }, []);

  return { selectedPlanId, handlePlanSelect };
}

function useRedeemInteraction(onRedeem) {
  const {
    redeemCode,
    formattedRedeemCode,
    handleRedeemCodeChange,
    redeemInputRef,
  } = useRedeemCodeField();

  const handleRedeem = useCallback(() => {
    if (onRedeem) {
      onRedeem(redeemCode);
    }
  }, [onRedeem, redeemCode]);

  return {
    formattedRedeemCode,
    onRedeemCodeChange: handleRedeemCodeChange,
    onRedeem: handleRedeem,
    redeemInputRef,
  };
}

const useSubscriptionHandlers = ({
  onPlanSelect,
  onRedeemCodeChange,
  onRedeem,
}) =>
  useMemo(
    () => ({
      onPlanSelect,
      onRedeemCodeChange,
      onRedeem,
    }),
    [onPlanSelect, onRedeem, onRedeemCodeChange],
  );

function useSubscriptionSectionController(props) {
  const { defaultSelectedPlanId, planCards, onRedeem } = props;

  const { selectedPlanId, handlePlanSelect } = usePlanSelection(
    defaultSelectedPlanId,
  );

  const {
    formattedRedeemCode,
    onRedeemCodeChange,
    onRedeem: handleRedeem,
    redeemInputRef,
  } = useRedeemInteraction(onRedeem);

  const { planRailNav } = usePlanCarouselNavigation(planCards.length);

  const handlers = useSubscriptionHandlers({
    onPlanSelect: handlePlanSelect,
    onRedeemCodeChange,
    onRedeem: handleRedeem,
  });

  return useSubscriptionSectionViewModel({
    baseProps: props,
    selectedPlanId,
    formattedRedeemCode,
    planRailNav,
    handlers,
    redeemInputRef,
  });
}

function SubscriptionSectionContainer(props) {
  const viewModel = useSubscriptionSectionController(props);
  return <SubscriptionSectionView {...viewModel} />;
}

SubscriptionSectionContainer.propTypes = {
  title: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
  planCards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      summary: PropTypes.string.isRequired,
      priceLines: PropTypes.arrayOf(PropTypes.string).isRequired,
      state: PropTypes.oneOf(["current", "available", "locked"]).isRequired,
      badge: PropTypes.string.isRequired,
      ctaLabel: PropTypes.string.isRequired,
      disabled: PropTypes.bool.isRequired,
      subscriptionExpiryLine: PropTypes.string,
    }),
  ).isRequired,
  featureMatrix: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      values: PropTypes.objectOf(PropTypes.string).isRequired,
    }),
  ).isRequired,
  visiblePlanIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  planLabels: PropTypes.objectOf(PropTypes.string).isRequired,
  pricingNote: PropTypes.string.isRequired,
  taxNote: PropTypes.string.isRequired,
  redeemCopy: PropTypes.shape({
    title: PropTypes.string.isRequired,
    placeholder: PropTypes.string.isRequired,
    buttonLabel: PropTypes.string.isRequired,
  }).isRequired,
  defaultSelectedPlanId: PropTypes.string.isRequired,
  onRedeem: PropTypes.func,
  featureColumnLabel: PropTypes.string.isRequired,
};

SubscriptionSectionContainer.defaultProps = {
  descriptionId: undefined,
  onRedeem: undefined,
};

export default SubscriptionSectionContainer;
