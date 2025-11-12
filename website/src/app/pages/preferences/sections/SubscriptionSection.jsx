import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import SubscriptionSectionView from "./SubscriptionSection/SubscriptionSectionView.jsx";
import { createSubscriptionSectionViewModel } from "./SubscriptionSection/viewModel";

const REDEEM_CODE_GROUP_SIZE = 4;
const REDEEM_CODE_MAX_LENGTH = 16;


function normalizeRedeemCodeInput(rawValue) {
  if (!rawValue) {
    return "";
  }
  return rawValue.replace(/[^0-9a-zA-Z]/g, "").slice(0, REDEEM_CODE_MAX_LENGTH);
}


function formatRedeemCodeForDisplay(code) {
  if (!code) {
    return "";
  }
  const groups = [];
  for (let index = 0; index < code.length; index += REDEEM_CODE_GROUP_SIZE) {
    groups.push(code.slice(index, index + REDEEM_CODE_GROUP_SIZE));
  }
  return groups.join("-");
}

function useSubscriptionSectionController(props) {
  const {
    defaultSelectedPlanId,
    planCards,
    onRedeem,
  } = props;
  const [selectedPlanId, setSelectedPlanId] = useState(defaultSelectedPlanId);
  const [redeemCode, setRedeemCode] = useState("");
  const redeemInputRef = useRef(null);
  const planCarouselRef = useRef(null);
  const [isPlanRailAtStart, setIsPlanRailAtStart] = useState(true);
  const [isPlanRailAtEnd, setIsPlanRailAtEnd] = useState(false);

  const formattedRedeemCode = useMemo(
    () => formatRedeemCodeForDisplay(redeemCode),
    [redeemCode],
  );

  const handlePlanSelect = useCallback((planId, disabled) => {
    if (disabled) {
      return;
    }
    setSelectedPlanId(planId);
  }, []);

  const handleRedeemCodeChange = useCallback((event) => {
    if (!event || typeof event !== "object" || !("target" in event)) {
      return;
    }
    const target = event.target;
    setRedeemCode(normalizeRedeemCodeInput(target?.value ?? ""));
  }, []);

  const handleRedeemAction = useCallback(() => {
    if (onRedeem) {
      onRedeem(redeemCode);
    }
  }, [onRedeem, redeemCode]);

  const syncPlanRailPosition = useCallback(() => {
    const node = planCarouselRef.current;
    if (!node) {
      setIsPlanRailAtStart(true);
      setIsPlanRailAtEnd(true);
      return;
    }
    const { scrollLeft, clientWidth, scrollWidth } = node;
    setIsPlanRailAtStart(scrollLeft <= 1);
    setIsPlanRailAtEnd(scrollLeft + clientWidth >= scrollWidth - 1);
  }, []);

  useEffect(() => {
    const node = planCarouselRef.current;
    if (!node) {
      return undefined;
    }
    const handleScroll = () => {
      syncPlanRailPosition();
    };
    handleScroll();
    node.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      node.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [syncPlanRailPosition]);

  useEffect(() => {
    syncPlanRailPosition();
  }, [planCards.length, syncPlanRailPosition]);

  const handlePlanRailNav = useCallback((direction) => {
    const node = planCarouselRef.current;
    if (!node) {
      return;
    }
    const scrollAmount = node.clientWidth * 0.85;
    node.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  }, []);

  const shouldRenderPlanRailNav = planCards.length > 1;
  const planRailNav = {
    viewportRef: planCarouselRef,
    showPrevNav: shouldRenderPlanRailNav && !isPlanRailAtStart,
    showNextNav: shouldRenderPlanRailNav && !isPlanRailAtEnd,
    isAtStart: isPlanRailAtStart,
    isAtEnd: isPlanRailAtEnd,
    onPrev: () => handlePlanRailNav(-1),
    onNext: () => handlePlanRailNav(1),
    prevLabel: "查看前一个订阅方案",
    nextLabel: "查看后一个订阅方案",
  };

  const handlers = {
    onPlanSelect: handlePlanSelect,
    onRedeemCodeChange: handleRedeemCodeChange,
    onRedeem: handleRedeemAction,
  };

  return createSubscriptionSectionViewModel({
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
    defaultSelectedPlanId,
    selectedPlanId,
    formattedRedeemCode,
    planRailNav,
    handlers,
    redeemRefs: { inputRef: redeemInputRef },
    featureColumnLabel: props.featureColumnLabel,
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
