import PropTypes from "prop-types";

export const PlanCardPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  summary: PropTypes.string.isRequired,
  priceLines: PropTypes.arrayOf(PropTypes.string).isRequired,
  state: PropTypes.oneOf(["current", "available", "locked"]).isRequired,
  badge: PropTypes.string.isRequired,
  ctaLabel: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
  subscriptionExpiryLine: PropTypes.string,
});

export const PlanRailPropType = PropTypes.shape({
  cards: PropTypes.arrayOf(PlanCardPropType).isRequired,
  selectedPlanId: PropTypes.string.isRequired,
  viewportRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) })
    .isRequired,
  showPrevNav: PropTypes.bool.isRequired,
  showNextNav: PropTypes.bool.isRequired,
  isAtStart: PropTypes.bool.isRequired,
  isAtEnd: PropTypes.bool.isRequired,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  prevLabel: PropTypes.string.isRequired,
  nextLabel: PropTypes.string.isRequired,
});

export const FeatureMatrixPropType = PropTypes.shape({
  featureColumnLabel: PropTypes.string.isRequired,
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      values: PropTypes.objectOf(PropTypes.string).isRequired,
    }),
  ).isRequired,
  visiblePlanIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  planLabels: PropTypes.objectOf(PropTypes.string).isRequired,
  currentPlanId: PropTypes.string.isRequired,
});

export const RedeemFormPropType = PropTypes.shape({
  title: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onRedeem: PropTypes.func.isRequired,
  buttonLabel: PropTypes.string.isRequired,
  inputRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) })
    .isRequired,
});

export const FootnotesPropType = PropTypes.shape({
  pricingNote: PropTypes.string.isRequired,
  taxNote: PropTypes.string.isRequired,
});
