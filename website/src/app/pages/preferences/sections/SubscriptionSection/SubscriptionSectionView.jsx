import PropTypes from "prop-types";
import SettingsSection from "@shared/components/settings/SettingsSection";
import styles from "../../Preferences.module.css";

function SubscriptionSectionView({
  section,
  planRail,
  featureMatrix,
  footnotes,
  redeemForm,
}) {
  return (
    <SettingsSection
      headingId={section.headingId}
      title={section.title}
      describedBy={section.descriptionId}
      classes={{
        section: `${styles.section} ${styles["section-plain"]} ${styles["subscription-section"]}`,
        header: styles["section-header"],
        title: styles["section-title"],
        divider: styles["section-divider"],
      }}
    >
      <div className={styles["subscription-matrix"]}>
        <div className={styles["subscription-plan-carousel"]}>
          {planRail.showPrevNav ? (
            <button
              type="button"
              className={`${styles["subscription-plan-nav"]} ${styles["subscription-plan-nav-previous"]}`}
              onClick={planRail.onPrev}
              aria-label={planRail.prevLabel}
            >
              <span aria-hidden="true">‹</span>
            </button>
          ) : null}
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
              {planRail.cards.map((plan) => {
                const isSelected = plan.id === planRail.selectedPlanId;
                const priceLineEntries = Array.isArray(plan.priceLines)
                  ? plan.priceLines
                  : [];
                const linesToRender =
                  isSelected && plan.subscriptionExpiryLine
                    ? [...priceLineEntries, plan.subscriptionExpiryLine]
                    : priceLineEntries;
                return (
                  <article
                    key={plan.id}
                    className={styles["subscription-plan"]}
                    data-state={plan.state}
                    data-selected={isSelected}
                    role="listitem"
                  >
                    <div className={styles["subscription-plan-body"]}>
                      <span className={styles["subscription-plan-badge"]}>
                        {plan.badge}
                      </span>
                      <h4 className={styles["subscription-plan-title"]}>
                        {plan.title}
                      </h4>
                      <p className={styles["subscription-plan-summary"]}>
                        {plan.summary}
                      </p>
                      <ul className={styles["subscription-plan-pricing"]}>
                        {linesToRender.map((line, index) => (
                          <li key={`${plan.id}-line-${index}`}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      className={styles["subscription-plan-cta"]}
                      onClick={() => planRail.onSelect(plan.id, plan.disabled)}
                      disabled={plan.disabled}
                      aria-pressed={isSelected}
                    >
                      {plan.ctaLabel}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
          {planRail.showNextNav ? (
            <button
              type="button"
              className={`${styles["subscription-plan-nav"]} ${styles["subscription-plan-nav-next"]}`}
              onClick={planRail.onNext}
              aria-label={planRail.nextLabel}
            >
              <span aria-hidden="true">›</span>
            </button>
          ) : null}
        </div>
        <div className={styles["subscription-table-wrapper"]}>
          <table className={styles["subscription-table"]}>
            <thead>
              <tr>
                <th scope="col">{featureMatrix.featureColumnLabel}</th>
                {featureMatrix.visiblePlanIds.map((planId) => (
                  <th key={planId} scope="col">
                    {featureMatrix.planLabels[planId] ?? planId}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureMatrix.rows.map((feature) => (
                <tr key={feature.id}>
                  <th scope="row">{feature.label}</th>
                  {featureMatrix.visiblePlanIds.map((planId) => (
                    <td
                      key={planId}
                      data-plan-state={
                        planId === featureMatrix.currentPlanId
                          ? "current"
                          : undefined
                      }
                    >
                      {feature.values[planId] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className={styles["subscription-footnotes"]}>
        <p>{footnotes.pricingNote}</p>
        <p>{footnotes.taxNote}</p>
      </div>
      <div className={styles["subscription-actions"]}>
        <div className={styles["subscription-redeem"]}>
          <h4 className={styles["subscription-redeem-title"]}>
            {redeemForm.title}
          </h4>
          <div className={styles["subscription-redeem-form"]}>
            <input
              ref={redeemForm.inputRef}
              type="text"
              className={styles["subscription-redeem-input"]}
              placeholder={redeemForm.placeholder}
              value={redeemForm.value}
              onChange={redeemForm.onChange}
            />
            <button
              type="button"
              className={styles["subscription-redeem-button"]}
              onClick={redeemForm.onRedeem}
            >
              {redeemForm.buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}

const PlanCardShape = PropTypes.shape({
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

SubscriptionSectionView.propTypes = {
  section: PropTypes.shape({
    headingId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    descriptionId: PropTypes.string,
  }).isRequired,
  planRail: PropTypes.shape({
    cards: PropTypes.arrayOf(PlanCardShape).isRequired,
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
  }).isRequired,
  featureMatrix: PropTypes.shape({
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
  }).isRequired,
  footnotes: PropTypes.shape({
    pricingNote: PropTypes.string.isRequired,
    taxNote: PropTypes.string.isRequired,
  }).isRequired,
  redeemForm: PropTypes.shape({
    title: PropTypes.string.isRequired,
    placeholder: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onRedeem: PropTypes.func.isRequired,
    buttonLabel: PropTypes.string.isRequired,
    inputRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) })
      .isRequired,
  }).isRequired,
};

export default SubscriptionSectionView;
