import PropTypes from "prop-types";

import styles from "../../../Preferences.module.css";
import {
  PlanCardPropType,
  PlanRailPropType,
} from "../propTypes.js";

const createPriceLineKey = (planId, line) => {
  const normalizedLine = String(line).replace(/\s+/g, "-");
  return `${planId}-price-line-${normalizedLine}`;
};

const PlanNavButton = ({ isVisible, className, label, onClick, icon }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      className={`${styles["subscription-plan-nav"]} ${className}`}
      onClick={onClick}
      aria-label={label}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
};

const PlanPriceLines = ({ plan, isSelected }) => {
  const priceLineEntries = Array.isArray(plan.priceLines)
    ? plan.priceLines
    : [];
  const linesToRender =
    isSelected && plan.subscriptionExpiryLine
      ? [...priceLineEntries, plan.subscriptionExpiryLine]
      : priceLineEntries;

  return (
    <ul className={styles["subscription-plan-pricing"]}>
      {linesToRender.map((line) => (
        <li key={createPriceLineKey(plan.id, line)}>{line}</li>
      ))}
    </ul>
  );
};

const PlanCard = ({ plan, isSelected, onSelect }) => (
  <article
    className={styles["subscription-plan"]}
    data-state={plan.state}
    data-selected={isSelected}
    role="listitem"
  >
    <div className={styles["subscription-plan-body"]}>
      <span className={styles["subscription-plan-badge"]}>{plan.badge}</span>
      <h4 className={styles["subscription-plan-title"]}>{plan.title}</h4>
      <p className={styles["subscription-plan-summary"]}>{plan.summary}</p>
      <PlanPriceLines plan={plan} isSelected={isSelected} />
    </div>
    <button
      type="button"
      className={styles["subscription-plan-cta"]}
      onClick={() => onSelect(plan.id, plan.disabled)}
      disabled={plan.disabled}
      aria-pressed={isSelected}
    >
      {plan.ctaLabel}
    </button>
  </article>
);

const PlanCardList = ({ planRail }) => (
  <div
    className={styles["subscription-plan-viewport"]}
    data-scroll-at-start={planRail.isAtStart}
    data-scroll-at-end={planRail.isAtEnd}
  >
    <div
      ref={planRail.viewportRef}
      className={styles["subscription-plan-grid"]}
      role="list"
    >
      {planRail.cards.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isSelected={plan.id === planRail.selectedPlanId}
          onSelect={planRail.onSelect}
        />
      ))}
    </div>
  </div>
);

const SubscriptionPlanCarousel = ({ planRail }) => (
  <div className={styles["subscription-plan-carousel"]}>
    <PlanNavButton
      isVisible={planRail.showPrevNav}
      className={styles["subscription-plan-nav-previous"]}
      label={planRail.prevLabel}
      onClick={planRail.onPrev}
      icon="‹"
    />
    <PlanCardList planRail={planRail} />
    <PlanNavButton
      isVisible={planRail.showNextNav}
      className={styles["subscription-plan-nav-next"]}
      label={planRail.nextLabel}
      onClick={planRail.onNext}
      icon="›"
    />
  </div>
);

PlanNavButton.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  className: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
};

PlanPriceLines.propTypes = {
  plan: PlanCardPropType.isRequired,
  isSelected: PropTypes.bool.isRequired,
};

PlanCard.propTypes = {
  plan: PlanCardPropType.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

PlanCardList.propTypes = {
  planRail: PlanRailPropType.isRequired,
};

SubscriptionPlanCarousel.propTypes = {
  planRail: PlanRailPropType.isRequired,
};

export default SubscriptionPlanCarousel;
